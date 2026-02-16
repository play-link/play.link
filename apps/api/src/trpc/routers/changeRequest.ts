import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {adminProcedure, protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'
import {isSlugProtected} from '../lib/protected-slugs'

// Roles that can create change requests
const REQUEST_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]

// Cooldown period for non-verified entities (24 hours in ms)
const COOLDOWN_MS = 24 * 60 * 60 * 1000

// Fields that require change requests for verified entities
const PROTECTED_FIELDS = ['slug', 'name'] as const

export const changeRequestRouter = router({
  /**
   * List change requests (for admin review)
   */
  list: adminProcedure
    .input(
      z.object({
        status: z
          .enum(['pending', 'approved', 'rejected', 'cancelled'])
          .optional(),
        entityType: z.enum(['studio', 'game', 'game_page']).optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('change_requests')
        .select(
          `
          *,
          requester:requested_by (
            user_id,
            email,
            username,
            display_name
          ),
          reviewer:reviewed_by (
            user_id,
            email,
            username
          )
        `,
        )
        .order('created_at', {ascending: false})
        .limit(input.limit)

      if (input.status) {
        query = query.eq('status', input.status)
      }
      if (input.entityType) {
        query = query.eq('entity_type', input.entityType)
      }

      const {data, error} = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      const requests = (data || []).map((request: any) => ({
        ...request,
        requester: Array.isArray(request.requester) ? request.requester[0] || null : request.requester,
        reviewer: Array.isArray(request.reviewer) ? request.reviewer[0] || null : request.reviewer,
      }))

      if (requests.length === 0) {
        return []
      }

      const missingRequesterRequests = requests.filter((request: any) => !request.requester?.email)

      if (missingRequesterRequests.length === 0) {
        return requests.map((request: any) => ({
          ...request,
          requested_by_email: request.requester?.email || null,
        }))
      }

      const studioEntityIds = new Set<string>()
      const gameEntityIds = new Set<string>()
      const pageEntityIds = new Set<string>()

      for (const request of missingRequesterRequests) {
        if (request.entity_type === 'studio') {
          studioEntityIds.add(request.entity_id)
        } else if (request.entity_type === 'game') {
          gameEntityIds.add(request.entity_id)
        } else if (request.entity_type === 'game_page') {
          pageEntityIds.add(request.entity_id)
        }
      }

      const ownerStudioByGameId = new Map<string, string>()
      if (gameEntityIds.size > 0) {
        const {data: gameRows, error: gamesError} = await supabase
          .from('games')
          .select('id, owner_studio_id')
          .in('id', Array.from(gameEntityIds))

        if (gamesError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: gamesError.message,
          })
        }

        for (const row of gameRows || []) {
          ownerStudioByGameId.set(row.id, row.owner_studio_id)
        }
      }

      const gameIdByPageId = new Map<string, string>()
      if (pageEntityIds.size > 0) {
        const {data: pageRows, error: pagesError} = await supabase
          .from('game_pages')
          .select('id, game_id')
          .in('id', Array.from(pageEntityIds))

        if (pagesError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: pagesError.message,
          })
        }

        const gameIdsFromPages = new Set<string>()
        for (const row of pageRows || []) {
          gameIdByPageId.set(row.id, row.game_id)
          gameIdsFromPages.add(row.game_id)
        }

        const missingGameIds = Array.from(gameIdsFromPages).filter((gameId) => !ownerStudioByGameId.has(gameId))

        if (missingGameIds.length > 0) {
          const {data: gamesFromPages, error: gamesFromPagesError} = await supabase
            .from('games')
            .select('id, owner_studio_id')
            .in('id', missingGameIds)

          if (gamesFromPagesError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: gamesFromPagesError.message,
            })
          }

          for (const row of gamesFromPages || []) {
            ownerStudioByGameId.set(row.id, row.owner_studio_id)
          }
        }
      }

      for (const request of missingRequesterRequests) {
        if (request.entity_type === 'game') {
          const studioId = ownerStudioByGameId.get(request.entity_id)
          if (studioId) studioEntityIds.add(studioId)
        } else if (request.entity_type === 'game_page') {
          const gameId = gameIdByPageId.get(request.entity_id)
          const studioId = gameId ? ownerStudioByGameId.get(gameId) : undefined
          if (studioId) studioEntityIds.add(studioId)
        }
      }

      const ownerUserByStudioId = new Map<string, string>()
      if (studioEntityIds.size > 0) {
        const {data: ownersRows, error: ownersError} = await supabase
          .from('studio_members')
          .select('studio_id, user_id, created_at')
          .in('studio_id', Array.from(studioEntityIds))
          .eq('role', StudioRole.OWNER)
          .order('created_at', {ascending: true})

        if (ownersError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: ownersError.message,
          })
        }

        for (const row of ownersRows || []) {
          if (!ownerUserByStudioId.has(row.studio_id)) {
            ownerUserByStudioId.set(row.studio_id, row.user_id)
          }
        }
      }

      const ownerEmailByStudioId = new Map<string, string>()
      const ownerUserIds = Array.from(new Set(ownerUserByStudioId.values()))
      if (ownerUserIds.length > 0) {
        const {data: profileRows, error: profilesError} = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', ownerUserIds)

        if (profilesError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: profilesError.message,
          })
        }

        const ownerEmailByUserId = new Map<string, string>()
        for (const row of profileRows || []) {
          if (row.email) ownerEmailByUserId.set(row.user_id, row.email)
        }

        for (const [studioId, ownerUserId] of ownerUserByStudioId.entries()) {
          const email = ownerEmailByUserId.get(ownerUserId)
          if (email) ownerEmailByStudioId.set(studioId, email)
        }
      }

      return requests.map((request: any) => {
        if (request.requester?.email) {
          return {
            ...request,
            requested_by_email: request.requester.email,
          }
        }

        let fallbackStudioId: string | undefined
        if (request.entity_type === 'studio') {
          fallbackStudioId = request.entity_id
        } else if (request.entity_type === 'game') {
          fallbackStudioId = ownerStudioByGameId.get(request.entity_id)
        } else if (request.entity_type === 'game_page') {
          const gameId = gameIdByPageId.get(request.entity_id)
          fallbackStudioId = gameId ? ownerStudioByGameId.get(gameId) : undefined
        }

        return {
          ...request,
          requested_by_email: fallbackStudioId ? ownerEmailByStudioId.get(fallbackStudioId) || null : null,
        }
      })
    }),

  /**
   * Get my pending change requests
   */
  myRequests: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['studio', 'game', 'game_page']).optional(),
        entityId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

      let query = supabase
        .from('change_requests')
        .select('*')
        .eq('requested_by', user.id)
        .order('created_at', {ascending: false})

      if (input.entityType) {
        query = query.eq('entity_type', input.entityType)
      }
      if (input.entityId) {
        query = query.eq('entity_id', input.entityId)
      }

      const {data, error} = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  /**
   * Create a change request
   * Called when trying to change name/slug on a verified entity
   */
  create: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['studio', 'game', 'game_page']),
        entityId: z.string().uuid(),
        fieldName: z.enum(['slug', 'name']),
        requestedValue: z.string().min(1).max(200),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user has permission on this entity
      if (input.entityType === 'studio') {
        const {data: member} = await supabase
          .from('studio_members')
          .select('role')
          .eq('studio_id', input.entityId)
          .eq('user_id', user.id)
          .single()

        if (!member || !REQUEST_ROLES.includes(member.role as StudioRoleType)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to request changes',
          })
        }
      } else if (input.entityType === 'game') {
        // For games, check user is member of owner studio
        const {data: game} = await supabase
          .from('games')
          .select('owner_studio_id')
          .eq('id', input.entityId)
          .single()

        if (!game) {
          throw new TRPCError({code: 'NOT_FOUND', message: 'Game not found'})
        }

        const {data: member} = await supabase
          .from('studio_members')
          .select('role')
          .eq('studio_id', game.owner_studio_id)
          .eq('user_id', user.id)
          .single()

        if (!member || !REQUEST_ROLES.includes(member.role as StudioRoleType)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to request changes',
          })
        }
      } else {
        // For game_pages, check page -> game -> studio membership
        const {data: page} = await supabase
          .from('game_pages')
          .select('game_id')
          .eq('id', input.entityId)
          .single()

        if (!page) {
          throw new TRPCError({code: 'NOT_FOUND', message: 'Game page not found'})
        }

        const {data: game} = await supabase
          .from('games')
          .select('owner_studio_id')
          .eq('id', page.game_id)
          .single()

        if (!game) {
          throw new TRPCError({code: 'NOT_FOUND', message: 'Game not found'})
        }

        const {data: member} = await supabase
          .from('studio_members')
          .select('role')
          .eq('studio_id', game.owner_studio_id)
          .eq('user_id', user.id)
          .single()

        if (!member || !REQUEST_ROLES.includes(member.role as StudioRoleType)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to request changes',
          })
        }
      }

      // Get current value
      const tableMap = {
        studio: 'studios',
        game: 'games',
        game_page: 'game_pages',
      } as const
      const table = tableMap[input.entityType]
      const {data: entity} = await supabase
        .from(table)
        .select('id, slug, name')
        .eq('id', input.entityId)
        .single()

      if (!entity) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Entity not found'})
      }

      const currentValue = entity[
        input.fieldName as keyof typeof entity
      ] as string

      if (currentValue === input.requestedValue) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'New value is the same as current value',
        })
      }

      // Check for existing pending request for same field
      const {data: existingRequest} = await supabase
        .from('change_requests')
        .select('id')
        .eq('entity_type', input.entityType)
        .eq('entity_id', input.entityId)
        .eq('field_name', input.fieldName)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A pending request for this field already exists',
        })
      }

      // Create the request
      const {data: request, error} = await supabase
        .from('change_requests')
        .insert({
          requested_by: user.id,
          entity_type: input.entityType,
          entity_id: input.entityId,
          field_name: input.fieldName,
          current_value: currentValue,
          requested_value: input.requestedValue,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_CREATE,
        studioId:
          input.entityType === 'studio' ? input.entityId : undefined,
        targetType: 'change_request',
        targetId: String(request.id),
        metadata: {
          entityType: input.entityType,
          entityId: input.entityId,
          field: input.fieldName,
          currentValue,
          requestedValue: input.requestedValue,
        },
      })

      return request
    }),

  /**
   * Cancel a pending change request (by requester)
   */
  cancel: protectedProcedure
    .input(z.object({id: z.number()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: request} = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', input.id)
        .single()

      if (!request) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Request not found'})
      }

      if (request.requested_by !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only cancel your own requests',
        })
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be cancelled',
        })
      }

      const {error} = await supabase
        .from('change_requests')
        .update({status: 'cancelled'})
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_CANCEL,
        studioId:
          request.entity_type === 'studio'
            ? request.entity_id
            : undefined,
        targetType: 'change_request',
        targetId: String(input.id),
        metadata: {
          entityType: request.entity_type,
          entityId: request.entity_id,
          field: request.field_name,
        },
      })

      return {success: true}
    }),

  /**
   * Approve a change request (admin only)
   */
  approve: adminProcedure
    .input(z.object({id: z.number(), notes: z.string().optional()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get the request
      const {data: request} = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', input.id)
        .single()

      if (!request) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Request not found'})
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be approved',
        })
      }

      // Apply the change
      const approveTableMap: Record<string, 'studios' | 'games' | 'game_pages'> = {
        studio: 'studios',
        game: 'games',
        game_page: 'game_pages',
      }
      const table = approveTableMap[request.entity_type] || 'games'
      const updateField = request.field_name
      const cooldownField = `last_${request.field_name}_change`
      const now = new Date().toISOString()
      let slugBecameProtected = false

      if (request.field_name === 'slug') {
        const protectedEntityType
          = request.entity_type === 'studio'
            ? 'studio'
            : request.entity_type === 'game_page'
              ? 'game_page'
              : null

        if (protectedEntityType) {
          slugBecameProtected = await isSlugProtected(
            supabase,
            protectedEntityType,
            request.requested_value,
          )
        }
      }

      const updatePayload: Record<string, unknown> = {
        [cooldownField]: now,
        updated_at: now,
      }

      if (request.field_name === 'slug' && request.entity_type === 'studio') {
        if (slugBecameProtected) {
          updatePayload.slug = `pending-studio-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
          updatePayload.requested_slug = request.requested_value
          updatePayload.is_verified = false
        } else {
          updatePayload.slug = request.requested_value
          updatePayload.requested_slug = null
        }
      } else if (request.field_name === 'slug' && request.entity_type === 'game_page') {
        if (slugBecameProtected) {
          updatePayload.slug = `pending-game-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
          updatePayload.requested_slug = request.requested_value
        } else {
          updatePayload.slug = request.requested_value
          updatePayload.requested_slug = null
        }
      } else {
        updatePayload[updateField] = request.requested_value
      }

      const {error: updateError} = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', request.entity_id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError.message,
        })
      }

      if (slugBecameProtected && request.entity_type === 'game_page') {
        const {data: page} = await supabase
          .from('game_pages')
          .select('game_id')
          .eq('id', request.entity_id)
          .single()

        if (!page) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Game page not found',
          })
        }

        const {error: gameError} = await supabase
          .from('games')
          .update({
            is_verified: false,
            updated_at: now,
          })
          .eq('id', page.game_id)

        if (gameError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: gameError.message,
          })
        }
      }

      if (slugBecameProtected && (request.entity_type === 'studio' || request.entity_type === 'game_page')) {
        if (request.entity_type === 'studio') {
          const {data: games, error: gamesError} = await supabase
            .from('games')
            .select('id')
            .eq('owner_studio_id', request.entity_id)

          if (gamesError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: gamesError.message,
            })
          }

          const gameIds = (games || []).map((game: {id: string}) => game.id)
          if (gameIds.length > 0) {
            const {error: unpublishError} = await supabase
              .from('game_pages')
              .update({
                visibility: 'DRAFT',
                unpublished_at: now,
                updated_at: now,
              })
              .in('game_id', gameIds)
              .eq('visibility', 'PUBLISHED')

            if (unpublishError) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: unpublishError.message,
              })
            }
          }
        } else {
          const {data: page} = await supabase
            .from('game_pages')
            .select('game_id')
            .eq('id', request.entity_id)
            .single()

          if (!page) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Game page not found',
            })
          }

          const {error: unpublishError} = await supabase
            .from('game_pages')
            .update({
              visibility: 'DRAFT',
              unpublished_at: now,
              updated_at: now,
            })
            .eq('game_id', page.game_id)
            .eq('visibility', 'PUBLISHED')

          if (unpublishError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: unpublishError.message,
            })
          }
        }
      }

      // Mark request as approved
      await supabase
        .from('change_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: now,
          reviewer_notes: input.notes || null,
        })
        .eq('id', input.id)

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_APPROVE,
        studioId:
          request.entity_type === 'studio'
            ? request.entity_id
            : undefined,
        targetType: 'change_request',
        targetId: String(request.id),
        metadata: {
          entityType: request.entity_type,
          entityId: request.entity_id,
          field: request.field_name,
          oldValue: request.current_value,
          newValue: request.requested_value,
          requiresVerification: slugBecameProtected,
        },
      })

      return {success: true}
    }),

  /**
   * Reject a change request (admin only)
   */
  reject: adminProcedure
    .input(z.object({id: z.number(), notes: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: request} = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', input.id)
        .single()

      if (!request) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Request not found'})
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be rejected',
        })
      }

      await supabase
        .from('change_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: input.notes,
        })
        .eq('id', input.id)

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_REJECT,
        studioId:
          request.entity_type === 'studio'
            ? request.entity_id
            : undefined,
        targetType: 'change_request',
        targetId: String(request.id),
        metadata: {
          entityType: request.entity_type,
          entityId: request.entity_id,
          field: request.field_name,
          reason: input.notes,
        },
      })

      return {success: true}
    }),
})

// Export helper for use in studio/game update endpoints
export {COOLDOWN_MS, PROTECTED_FIELDS}
