import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {adminProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'
import {
  demotePrimaryGamePageSlug,
  demoteStudioSlug,
  promotePrimaryGamePageRequestedSlug,
  promoteStudioRequestedSlug,
} from '../lib/slug-lifecycle'
import {resolveOutreachTargetSlugs} from '../lib/outreach-slugs'

const protectedSlugSchema = z
  .string()
  .min(3)
  .max(150)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only',
  )

const claimStatusSchema = z.enum(['open', 'reviewing', 'resolved', 'rejected'])
const ownershipClaimStatusSchema = z.enum(['open', 'approved', 'rejected'])
const outreachChannelSchema = z.enum(['email', 'discord', 'twitter'])
const outreachLeadStatusSchema = z.enum([
  'new',
  'queued',
  'contacted',
  'replied',
  'interested',
  'not_interested',
  'bounced',
  'blocked',
  'claimed',
])
const outreachThreadStatusSchema = z.enum(['open', 'awaiting_reply', 'replied', 'closed'])
const outreachMessageStatusSchema = z.enum(['queued', 'sent', 'delivered', 'failed'])
const outreachDirectionSchema = z.enum(['outbound', 'inbound'])
const dbUuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID')

function getResolutionAction(unverifyGame: boolean, unverifyStudio: boolean) {
  if (unverifyGame && unverifyStudio) return 'unverified_both'
  if (unverifyGame) return 'unverified_game'
  if (unverifyStudio) return 'unverified_studio'
  return 'none'
}

export const adminRouter = router({
  /**
   * Get dashboard summary counts
   */
  getDashboardSummary: adminProcedure.query(async ({ctx}) => {
    const {supabase} = ctx

    const [
      {count: pendingRequests},
      {count: unverifiedStudios},
      {count: unverifiedGames},
      {count: openReports},
      {count: openOwnershipClaims},
    ] = await Promise.all([
      supabase
        .from('change_requests')
        .select('*', {count: 'exact', head: true})
        .eq('status', 'pending'),
      supabase
        .from('studios')
        .select('*', {count: 'exact', head: true})
        .eq('is_verified', false),
      supabase
        .from('games')
        .select('*', {count: 'exact', head: true})
        .eq('is_verified', false),
      supabase
        .from('verification_claims')
        .select('*', {count: 'exact', head: true})
        .in('status', ['open', 'reviewing']),
      supabase
        .from('ownership_claims')
        .select('*', {count: 'exact', head: true})
        .eq('status', 'open'),
    ])

    return {
      pendingRequests: pendingRequests ?? 0,
      unverifiedStudios: unverifiedStudios ?? 0,
      unverifiedGames: unverifiedGames ?? 0,
      openReports: openReports ?? 0,
      openOwnershipClaims: openOwnershipClaims ?? 0,
      openClaims: (openReports ?? 0) + (openOwnershipClaims ?? 0),
    }
  }),

  /**
   * List all studios with verification status
   */
  listStudios: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().min(0).optional(),
        search: z.string().trim().max(100).optional(),
        isVerified: z.boolean().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const cursor = input.cursor ?? 0
      const trimmedSearch = input.search?.trim()

      let query = supabase
        .from('studios')
        .select('id, name, slug, requested_slug, avatar_url, is_verified, is_claimable, created_at')
        .order('created_at', {ascending: false})
        .range(cursor, cursor + input.limit - 1)

      if (input.isVerified !== undefined) {
        query = query.eq('is_verified', input.isVerified)
      }
      if (trimmedSearch) {
        const escapedSearch = trimmedSearch.replaceAll('%', '\\%').replaceAll('_', '\\_')
        query = query.or(`name.ilike.%${escapedSearch}%,slug.ilike.%${escapedSearch}%,requested_slug.ilike.%${escapedSearch}%`)
      }

      const {data, error} = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      const items = data || []
      const nextCursor = items.length === input.limit ? cursor + items.length : null

      return {
        items,
        nextCursor,
      }
    }),

  /**
   * List all games with verification status
   */
  listGames: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().min(0).optional(),
        search: z.string().trim().max(100).optional(),
        isVerified: z.boolean().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const cursor = input.cursor ?? 0
      const trimmedSearch = input.search?.trim()

      let query = supabase
        .from('games')
        .select(
          `
          id,
          title,
          cover_url,
          is_verified,
          created_at,
          owner_studio:studios!owner_studio_id (
            id,
            name,
            slug,
            requested_slug
          )
        `,
        )
        .order('created_at', {ascending: false})
        .range(cursor, cursor + input.limit - 1)

      if (input.isVerified !== undefined) {
        query = query.eq('is_verified', input.isVerified)
      }
      if (trimmedSearch) {
        const escapedSearch = trimmedSearch.replaceAll('%', '\\%').replaceAll('_', '\\_')
        const [{data: titleMatches, error: titleMatchesError}, {data: slugMatches, error: slugMatchesError}]
          = await Promise.all([
            supabase
              .from('games')
              .select('id')
              .ilike('title', `%${escapedSearch}%`),
            supabase
              .from('game_pages')
              .select('game_id')
              .eq('is_primary', true)
              .or(`slug.ilike.%${escapedSearch}%,requested_slug.ilike.%${escapedSearch}%`),
          ])

        if (titleMatchesError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: titleMatchesError.message,
          })
        }
        if (slugMatchesError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: slugMatchesError.message,
          })
        }

        const matchedGameIds = new Set<string>([
          ...(titleMatches || []).map((row: {id: string}) => row.id),
          ...(slugMatches || []).map((row: {game_id: string}) => row.game_id),
        ])

        if (matchedGameIds.size === 0) {
          return {
            items: [],
            nextCursor: null,
          }
        }

        query = query.in('id', Array.from(matchedGameIds))
      }

      const {data, error} = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      const games = data || []
      if (games.length === 0) {
        return {
          items: [],
          nextCursor: null,
        }
      }

      const gameIds = games.map((game: {id: string}) => game.id)
      const {data: pages, error: pagesError} = await supabase
        .from('game_pages')
        .select('id, game_id, slug, requested_slug, is_claimable')
        .in('game_id', gameIds)
        .eq('is_primary', true)

      if (pagesError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: pagesError.message,
        })
      }

      const primaryPageByGameId = new Map<string, {
        id: string
        slug: string
        requested_slug: string | null
        is_claimable: boolean
      }>()
      for (const page of pages || []) {
        primaryPageByGameId.set(page.game_id, {
          id: page.id,
          slug: page.slug,
          requested_slug: page.requested_slug || null,
          is_claimable: page.is_claimable,
        })
      }

      const items = games.map((game) => {
        const primaryPage = primaryPageByGameId.get(game.id)
        return {
          ...game,
          is_claimable: primaryPage?.is_claimable ?? false,
          primary_page_id: primaryPage?.id ?? null,
          primary_page_slug: primaryPage?.slug ?? null,
          primary_page_requested_slug: primaryPage?.requested_slug ?? null,
        }
      })
      const nextCursor = games.length === input.limit ? cursor + games.length : null

      return {
        items,
        nextCursor,
      }
    }),

  /**
   * List ownership claims.
   */
  listOwnershipClaims: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: ownershipClaimStatusSchema.optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('ownership_claims')
        .select(`
          id,
          status,
          page_id,
          game_id,
          current_studio_id,
          requested_studio_id,
          claimed_slug,
          details,
          claimant_user_id,
          claimant_email,
          admin_notes,
          handled_by,
          handled_at,
          created_at,
          updated_at,
          page:game_pages!ownership_claims_page_id_fkey(id, slug, requested_slug),
          game:games!ownership_claims_game_id_fkey(id, title, is_verified),
          current_studio:studios!ownership_claims_current_studio_id_fkey(id, name, slug, requested_slug, is_verified),
          requested_studio:studios!ownership_claims_requested_studio_id_fkey(id, name, slug, requested_slug, is_verified),
          claimant:profiles!ownership_claims_claimant_user_id_fkey(user_id, email, username, display_name)
        `)
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (input.status) {
        query = query.eq('status', input.status)
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
   * Update ownership claim status and optionally transfer game ownership.
   */
  updateOwnershipClaim: adminProcedure
    .input(
      z.object({
        claimId: dbUuidSchema,
        status: ownershipClaimStatusSchema,
        adminNotes: z.string().max(2000).optional().nullable(),
        transferOwnership: z.boolean().default(true),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: claim, error: claimError} = await supabase
        .from('ownership_claims')
        .select('id, page_id, game_id, current_studio_id, requested_studio_id, status')
        .eq('id', input.claimId)
        .single()

      if (claimError || !claim) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ownership claim not found',
        })
      }

      const now = new Date().toISOString()

      if (input.status === 'approved' && input.transferOwnership) {
        const {error: transferError} = await supabase
          .from('games')
          .update({
            owner_studio_id: claim.requested_studio_id,
            is_verified: true,
            updated_at: now,
          })
          .eq('id', claim.game_id)

        if (transferError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: transferError.message,
          })
        }

        try {
          await promotePrimaryGamePageRequestedSlug(supabase, {
            gameId: claim.game_id,
            nowIso: now,
          })
        } catch (promotionError: any) {
          const errorMessage = promotionError?.message || 'Failed to promote requested game slug'
          if (errorMessage.includes('already taken')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: errorMessage,
            })
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
          })
        }

        const {error: unclaimableError} = await supabase
          .from('game_pages')
          .update({
            is_claimable: false,
            updated_at: now,
          })
          .eq('id', claim.page_id)

        if (unclaimableError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: unclaimableError.message,
          })
        }
      }

      const {error: updateError} = await supabase
        .from('ownership_claims')
        .update({
          status: input.status,
          admin_notes: input.adminNotes || null,
          handled_by: user.id,
          handled_at: now,
          updated_at: now,
        })
        .eq('id', input.claimId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError.message,
        })
      }

      const auditAction = input.status === 'approved'
        ? AuditAction.OWNERSHIP_CLAIM_APPROVE
        : input.status === 'rejected'
          ? AuditAction.OWNERSHIP_CLAIM_REJECT
          : AuditAction.STUDIO_UPDATE

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: auditAction,
        studioId: claim.requested_studio_id,
        targetType: 'ownership_claim',
        targetId: claim.id,
        metadata: {
          previousStatus: claim.status,
          newStatus: input.status,
          gameId: claim.game_id,
          pageId: claim.page_id,
          currentStudioId: claim.current_studio_id,
          requestedStudioId: claim.requested_studio_id,
          transferOwnership: input.transferOwnership,
          claimableDisabled: input.status === 'approved' && input.transferOwnership,
        },
      })

      return {success: true}
    }),

  /**
   * List moderation claims/reports
   */
  listVerificationClaims: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: claimStatusSchema.optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('verification_claims')
        .select(`
          id,
          target_type,
          target_id,
          page_id,
          game_id,
          studio_id,
          slug_snapshot,
          report_type,
          details,
          reporter_email,
          status,
          resolution_action,
          resolution_notes,
          handled_by,
          handled_at,
          created_at,
          updated_at,
          game:games(id, title, is_verified),
          studio:studios(id, name, slug, requested_slug, is_verified),
          page:game_pages(id, slug, requested_slug)
        `)
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (input.status) {
        query = query.eq('status', input.status)
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
   * Update moderation claim status and optionally unverify entities.
   */
  updateVerificationClaim: adminProcedure
    .input(
      z.object({
        claimId: dbUuidSchema,
        status: claimStatusSchema,
        resolutionNotes: z.string().max(2000).optional().nullable(),
        unverifyGame: z.boolean().default(false),
        unverifyStudio: z.boolean().default(false),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: claim, error: claimError} = await supabase
        .from('verification_claims')
        .select('id, game_id, studio_id, status')
        .eq('id', input.claimId)
        .single()

      if (claimError || !claim) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Claim not found',
        })
      }

      const now = new Date().toISOString()
      const resolutionAction = getResolutionAction(
        input.unverifyGame,
        input.unverifyStudio,
      )

      if (input.unverifyGame && claim.game_id) {
        const {error: gameError} = await supabase
          .from('games')
          .update({
            is_verified: false,
            updated_at: now,
          })
          .eq('id', claim.game_id)

        if (gameError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: gameError.message,
          })
        }

        try {
          await demotePrimaryGamePageSlug(supabase, {
            gameId: claim.game_id,
            nowIso: now,
          })
        } catch (demotionError: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: demotionError?.message || 'Failed to demote game slug',
          })
        }

        await logAuditEvent(supabase, {
          userId: user.id,
          userEmail: user.email,
          action: AuditAction.GAME_UNVERIFY,
          targetType: 'game',
          targetId: claim.game_id,
          metadata: {source: 'verification_claim', claimId: claim.id},
        })
      }

      if (input.unverifyStudio && claim.studio_id) {
        const {error: studioError} = await supabase
          .from('studios')
          .update({
            is_verified: false,
            updated_at: now,
          })
          .eq('id', claim.studio_id)

        if (studioError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: studioError.message,
          })
        }

        try {
          await demoteStudioSlug(supabase, {
            studioId: claim.studio_id,
            nowIso: now,
          })
        } catch (demotionError: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: demotionError?.message || 'Failed to demote studio slug',
          })
        }

        await logAuditEvent(supabase, {
          userId: user.id,
          userEmail: user.email,
          action: AuditAction.STUDIO_UNVERIFY,
          targetType: 'studio',
          targetId: claim.studio_id,
          metadata: {source: 'verification_claim', claimId: claim.id},
        })
      }

      const {error: updateError} = await supabase
        .from('verification_claims')
        .update({
          status: input.status,
          resolution_action: resolutionAction,
          resolution_notes: input.resolutionNotes || null,
          handled_by: user.id,
          handled_at: now,
          updated_at: now,
        })
        .eq('id', input.claimId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_APPROVE,
        targetType: 'verification_claim',
        targetId: input.claimId,
        metadata: {
          previousStatus: claim.status,
          newStatus: input.status,
          resolutionAction,
        },
      })

      return {success: true}
    }),

  /**
   * List protected slugs.
   */
  listProtectedSlugs: adminProcedure
    .input(
      z.object({
        entityType: z.enum(['studio', 'game_page']).optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('protected_slugs')
        .select('id, entity_type, slug, reason, created_by, created_at, updated_at')
        .order('created_at', {ascending: false})

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

      return data || []
    }),

  /**
   * Add a protected slug.
   */
  addProtectedSlug: adminProcedure
    .input(
      z.object({
        entityType: z.enum(['studio', 'game_page']),
        slug: protectedSlugSchema,
        reason: z.string().max(500).optional().nullable(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const normalizedSlug = input.slug.trim().toLowerCase()

      const {error} = await supabase
        .from('protected_slugs')
        .insert({
          entity_type: input.entityType,
          slug: normalizedSlug,
          reason: input.reason || null,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This slug is already protected',
          })
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.STUDIO_UPDATE,
        targetType: 'protected_slug',
        targetId: `${input.entityType}:${normalizedSlug}`,
        metadata: {
          entityType: input.entityType,
          slug: normalizedSlug,
          reason: input.reason || null,
        },
      })

      return {success: true}
    }),

  /**
   * Remove a protected slug.
   */
  removeProtectedSlug: adminProcedure
    .input(z.object({id: dbUuidSchema}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: existing} = await supabase
        .from('protected_slugs')
        .select('id, entity_type, slug')
        .eq('id', input.id)
        .maybeSingle()

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Protected slug not found',
        })
      }

      const {error} = await supabase
        .from('protected_slugs')
        .delete()
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
        action: AuditAction.STUDIO_UPDATE,
        targetType: 'protected_slug',
        targetId: input.id,
        metadata: {
          entityType: existing.entity_type,
          slug: existing.slug,
        },
      })

      return {success: true}
    }),

  /**
   * Set studio verification status
   */
  setStudioVerified: adminProcedure
    .input(
      z.object({
        studioId: dbUuidSchema,
        isVerified: z.boolean(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: studio, error: fetchError} = await supabase
        .from('studios')
        .select('id, name, slug, requested_slug, is_verified')
        .eq('id', input.studioId)
        .single()

      if (fetchError || !studio) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Studio not found',
        })
      }

      const now = new Date().toISOString()

      if (input.isVerified) {
        try {
          await promoteStudioRequestedSlug(supabase, {
            studioId: input.studioId,
            nowIso: now,
          })
        } catch (promotionError: any) {
          const errorMessage = promotionError?.message || 'Failed to promote requested studio slug'
          if (errorMessage.includes('already taken')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: errorMessage,
            })
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
          })
        }
      }

      const {error} = await supabase
        .from('studios')
        .update({
          is_verified: input.isVerified,
          updated_at: now,
        })
        .eq('id', input.studioId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      if (!input.isVerified) {
        try {
          await demoteStudioSlug(supabase, {
            studioId: input.studioId,
            nowIso: now,
          })
        } catch (demotionError: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: demotionError?.message || 'Failed to demote studio slug',
          })
        }
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: input.isVerified
          ? AuditAction.STUDIO_VERIFY
          : AuditAction.STUDIO_UNVERIFY,
        studioId: input.studioId,
        targetType: 'studio',
        targetId: input.studioId,
        metadata: {
          name: studio.name,
          slug: studio.slug,
          requestedSlug: studio.requested_slug || null,
          previousStatus: studio.is_verified,
          newStatus: input.isVerified,
        },
      })

      return {success: true}
    }),

  /**
   * Set game verification status
   */
  setGameVerified: adminProcedure
    .input(
      z.object({
        gameId: dbUuidSchema,
        isVerified: z.boolean(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: game, error: fetchError} = await supabase
        .from('games')
        .select('id, title, owner_studio_id, is_verified')
        .eq('id', input.gameId)
        .single()

      if (fetchError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      const now = new Date().toISOString()

      if (input.isVerified) {
        try {
          await promotePrimaryGamePageRequestedSlug(supabase, {
            gameId: input.gameId,
            nowIso: now,
          })
        } catch (promotionError: any) {
          const errorMessage = promotionError?.message || 'Failed to promote requested game slug'
          if (errorMessage.includes('already taken')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: errorMessage,
            })
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
          })
        }
      }

      const {error} = await supabase
        .from('games')
        .update({
          is_verified: input.isVerified,
          updated_at: now,
        })
        .eq('id', input.gameId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      if (!input.isVerified) {
        try {
          await demotePrimaryGamePageSlug(supabase, {
            gameId: input.gameId,
            nowIso: now,
          })
        } catch (demotionError: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: demotionError?.message || 'Failed to demote game slug',
          })
        }
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: input.isVerified
          ? AuditAction.GAME_VERIFY
          : AuditAction.GAME_UNVERIFY,
        studioId: game.owner_studio_id,
        targetType: 'game',
        targetId: input.gameId,
        metadata: {
          title: game.title,
          previousStatus: game.is_verified,
          newStatus: input.isVerified,
        },
      })

      return {success: true}
    }),

  /**
   * Set studio claimability status
   */
  setStudioClaimable: adminProcedure
    .input(
      z.object({
        studioId: dbUuidSchema,
        isClaimable: z.boolean(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: studio, error: fetchError} = await supabase
        .from('studios')
        .select('id, name, slug, requested_slug, is_claimable')
        .eq('id', input.studioId)
        .single()

      if (fetchError || !studio) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Studio not found',
        })
      }

      const {error} = await supabase
        .from('studios')
        .update({
          is_claimable: input.isClaimable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.studioId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.STUDIO_UPDATE,
        studioId: input.studioId,
        targetType: 'studio',
        targetId: input.studioId,
        metadata: {
          name: studio.name,
          slug: studio.slug,
          requestedSlug: studio.requested_slug || null,
          previousClaimable: studio.is_claimable,
          newClaimable: input.isClaimable,
        },
      })

      return {success: true}
    }),

  /**
   * Set game claimability status through its primary page
   */
  setGameClaimable: adminProcedure
    .input(
      z.object({
        gameId: dbUuidSchema,
        isClaimable: z.boolean(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('id, title, owner_studio_id')
        .eq('id', input.gameId)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      const {data: page, error: pageError} = await supabase
        .from('game_pages')
        .select('id, slug, requested_slug, is_claimable')
        .eq('game_id', input.gameId)
        .eq('is_primary', true)
        .maybeSingle()

      if (pageError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: pageError.message,
        })
      }

      if (!page) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Primary game page not found',
        })
      }

      const {error: updateError} = await supabase
        .from('game_pages')
        .update({
          is_claimable: input.isClaimable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_UPDATE,
        studioId: game.owner_studio_id,
        targetType: 'game_page',
        targetId: page.id,
        metadata: {
          gameId: game.id,
          gameTitle: game.title,
          pageSlug: page.slug,
          requestedSlug: page.requested_slug || null,
          previousClaimable: page.is_claimable,
          newClaimable: input.isClaimable,
        },
      })

      return {success: true}
    }),

  /**
   * List admin outreach leads.
   */
  listOutreachLeads: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(200),
        offset: z.number().min(0).default(0),
        search: z.string().trim().max(200).optional(),
        status: outreachLeadStatusSchema.optional(),
        channel: outreachChannelSchema.optional(),
        isBlocked: z.boolean().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('admin_outreach_leads')
        .select(`
          id,
          target_type,
          target_game_id,
          target_studio_id,
          target_slug,
          target_name,
          channel,
          contact_identifier,
          contact_display_name,
          source,
          confidence_score,
          status,
          is_blocked,
          owner_admin_user_id,
          notes,
          last_contacted_at,
          next_action_at,
          created_at,
          updated_at,
          owner_admin:profiles!admin_outreach_leads_owner_admin_user_id_fkey(user_id, email, username, display_name)
        `)
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (input.status) {
        query = query.eq('status', input.status)
      }
      if (input.channel) {
        query = query.eq('channel', input.channel)
      }
      if (input.isBlocked !== undefined) {
        query = query.eq('is_blocked', input.isBlocked)
      }
      if (input.search?.trim()) {
        const escapedSearch = input.search.trim().replaceAll('%', '\\%').replaceAll('_', '\\_')
        query = query.or(
          `target_name.ilike.%${escapedSearch}%,target_slug.ilike.%${escapedSearch}%,contact_identifier.ilike.%${escapedSearch}%,contact_display_name.ilike.%${escapedSearch}%`,
        )
      }

      const {data, error} = await query
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      const items = data || []
      if (items.length === 0) return items

      const resolvedSlugs = await resolveOutreachTargetSlugs({
        supabase,
        targets: items,
        errorMessage: 'Failed to enrich outreach lead slugs',
      })

      return items.map((lead, index) => ({
        ...lead,
        ...resolvedSlugs[index],
      }))
    }),

  /**
   * Fetch enriched game/studio info for an outreach lead target.
   */
  getOutreachLeadTargetInfo: adminProcedure
    .input(
      z.object({
        leadId: dbUuidSchema,
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data: lead, error: leadError} = await supabase
        .from('admin_outreach_leads')
        .select('id, target_type, target_slug, target_game_id, target_studio_id')
        .eq('id', input.leadId)
        .maybeSingle()

      if (leadError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: leadError.message,
        })
      }
      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Outreach lead not found',
        })
      }

      const normalizedTargetSlug = lead.target_slug?.replace(/^@/, '') || null

      if (lead.target_type === 'studio') {
        let studioQuery = supabase
          .from('studios')
          .select('id, name, slug, requested_slug, is_verified, is_claimable, created_at')
          .limit(1)

        if (lead.target_studio_id) {
          studioQuery = studioQuery.eq('id', lead.target_studio_id)
        } else if (normalizedTargetSlug) {
          studioQuery = studioQuery.or(`slug.eq.${normalizedTargetSlug},requested_slug.eq.${normalizedTargetSlug}`)
        } else {
          return {
            targetType: 'studio' as const,
            studio: null,
            game: null,
          }
        }

        const {data: studio, error: studioError} = await studioQuery.maybeSingle()
        if (studioError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: studioError.message,
          })
        }

        return {
          targetType: 'studio' as const,
          studio: studio || null,
          game: null,
        }
      }

      let gameId: string | null = lead.target_game_id || null
      if (!gameId && normalizedTargetSlug) {
        const {data: pageBySlug, error: pageBySlugError} = await supabase
          .from('game_pages')
          .select('game_id')
          .or(`slug.eq.${normalizedTargetSlug},requested_slug.eq.${normalizedTargetSlug}`)
          .eq('is_primary', true)
          .limit(1)
          .maybeSingle()

        if (pageBySlugError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: pageBySlugError.message,
          })
        }

        gameId = pageBySlug?.game_id || null
      }

      if (!gameId) {
        return {
          targetType: 'game' as const,
          game: null,
          studio: null,
        }
      }

      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('id, title, is_verified, created_at, owner_studio_id')
        .eq('id', gameId)
        .maybeSingle()

      if (gameError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: gameError.message,
        })
      }

      const {data: gamePage, error: gamePageError} = await supabase
        .from('game_pages')
        .select('slug, requested_slug, is_claimable')
        .eq('game_id', gameId)
        .eq('is_primary', true)
        .limit(1)
        .maybeSingle()

      if (gamePageError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: gamePageError.message,
        })
      }

      let studio: {
        id: string
        name: string
        slug: string
        requested_slug: string | null
        is_verified: boolean
        is_claimable: boolean
        created_at: string
      } | null = null

      if (game?.owner_studio_id) {
        const {data: ownerStudio, error: ownerStudioError} = await supabase
          .from('studios')
          .select('id, name, slug, requested_slug, is_verified, is_claimable, created_at')
          .eq('id', game.owner_studio_id)
          .maybeSingle()

        if (ownerStudioError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: ownerStudioError.message,
          })
        }
        studio = ownerStudio || null
      }

      return {
        targetType: 'game' as const,
        game: game
          ? {
            id: game.id,
            title: game.title,
            slug: gamePage?.slug || normalizedTargetSlug,
            requested_slug: gamePage?.requested_slug ?? null,
            is_verified: game.is_verified,
            is_claimable: gamePage?.is_claimable ?? null,
            created_at: game.created_at,
          }
          : null,
        studio,
      }
    }),

  /**
   * Update lead status/metadata for admin outreach.
   */
  updateOutreachLead: adminProcedure
    .input(
      z.object({
        leadId: dbUuidSchema,
        status: outreachLeadStatusSchema.optional(),
        isBlocked: z.boolean().optional(),
        ownerAdminUserId: dbUuidSchema.nullable().optional(),
        notes: z.string().max(4000).nullable().optional(),
        nextActionAt: z.string().datetime().nullable().optional(),
        lastContactedAt: z.string().datetime().nullable().optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: existing, error: existingError} = await supabase
        .from('admin_outreach_leads')
        .select('id, status, is_blocked, owner_admin_user_id, notes, next_action_at, last_contacted_at')
        .eq('id', input.leadId)
        .maybeSingle()

      if (existingError || !existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Outreach lead not found',
        })
      }

      const hasChanges = input.status !== undefined
        || input.isBlocked !== undefined
        || input.ownerAdminUserId !== undefined
        || input.notes !== undefined
        || input.nextActionAt !== undefined
        || input.lastContactedAt !== undefined

      if (!hasChanges) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No changes provided',
        })
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (input.status !== undefined) updates.status = input.status
      if (input.status === 'blocked' && input.isBlocked === undefined) {
        updates.is_blocked = true
      }
      if (input.status !== 'blocked' && input.isBlocked === undefined && existing.is_blocked) {
        updates.is_blocked = false
      }
      if (input.isBlocked !== undefined) {
        updates.is_blocked = input.isBlocked
        if (input.isBlocked && input.status === undefined) {
          updates.status = 'blocked'
        }
        if (!input.isBlocked && input.status === undefined && existing.status === 'blocked') {
          updates.status = 'new'
        }
      }
      if (input.ownerAdminUserId !== undefined) updates.owner_admin_user_id = input.ownerAdminUserId
      if (input.notes !== undefined) updates.notes = input.notes
      if (input.nextActionAt !== undefined) updates.next_action_at = input.nextActionAt
      if (input.lastContactedAt !== undefined) updates.last_contacted_at = input.lastContactedAt

      const {error} = await supabase
        .from('admin_outreach_leads')
        .update(updates)
        .eq('id', input.leadId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ADMIN_OUTREACH_LEAD_UPDATE,
        targetType: 'admin_outreach_lead',
        targetId: input.leadId,
        metadata: {
          previousStatus: existing.status,
          previousBlocked: existing.is_blocked,
          updates,
        },
      })

      return {success: true}
    }),

  /**
   * List admin outreach threads.
   */
  listOutreachThreads: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(200),
        offset: z.number().min(0).default(0),
        search: z.string().trim().max(200).optional(),
        status: outreachThreadStatusSchema.optional(),
        channel: outreachChannelSchema.optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('admin_outreach_threads')
        .select(`
          id,
          lead_id,
          channel,
          status,
          external_thread_id,
          last_outbound_at,
          last_inbound_at,
          assigned_admin_user_id,
          created_at,
          updated_at,
          closed_at,
          lead:admin_outreach_leads(
            id,
            target_type,
            target_game_id,
            target_studio_id,
            target_name,
            target_slug,
            contact_identifier,
            status,
            is_blocked
          ),
          assigned_admin:profiles!admin_outreach_threads_assigned_admin_user_id_fkey(
            user_id,
            email,
            username,
            display_name
          )
        `)
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (input.status) query = query.eq('status', input.status)
      if (input.channel) query = query.eq('channel', input.channel)

      const {data, error} = await query
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      const rawItems = data || []
      if (rawItems.length === 0) return rawItems

      const leadsByRow = rawItems
        .map((thread, index) => ({
          index,
          lead: Array.isArray(thread.lead) ? thread.lead[0] : thread.lead,
        }))
        .filter((item): item is {index: number; lead: NonNullable<typeof item.lead>} => Boolean(item.lead))

      const resolvedLeads = await resolveOutreachTargetSlugs({
        supabase,
        targets: leadsByRow.map((item) => item.lead),
        errorMessage: 'Failed to enrich outreach thread slugs',
      })

      const resolvedLeadByRowIndex = new Map(
        leadsByRow.map((item, index) => [item.index, resolvedLeads[index]] as const),
      )

      const items = rawItems.map((thread, index) => {
        const lead = Array.isArray(thread.lead) ? thread.lead[0] : thread.lead
        const resolvedLead = resolvedLeadByRowIndex.get(index)

        if (!lead || !resolvedLead) return thread
        return {
          ...thread,
          lead: {
            ...lead,
            ...resolvedLead,
          },
        }
      })
      if (!input.search?.trim()) return items

      const search = input.search.trim().toLowerCase()
      return items.filter((thread) => {
        const lead = Array.isArray(thread.lead) ? thread.lead[0] : thread.lead
        const leadWithResolved = lead as
          | (typeof lead & {target_requested_slug?: string | null; target_real_slug?: string | null})
          | null
        const resolvedSlug = leadWithResolved?.target_requested_slug
          || leadWithResolved?.target_real_slug
          || leadWithResolved?.target_slug
          || ''
        return (
          (thread.external_thread_id || '').toLowerCase().includes(search)
          || (leadWithResolved?.target_name || '').toLowerCase().includes(search)
          || resolvedSlug.toLowerCase().includes(search)
          || (leadWithResolved?.contact_identifier || '').toLowerCase().includes(search)
        )
      })
    }),

  /**
   * Update admin outreach thread status/assignment.
   */
  updateOutreachThread: adminProcedure
    .input(
      z.object({
        threadId: dbUuidSchema,
        status: outreachThreadStatusSchema.optional(),
        assignedAdminUserId: dbUuidSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: existing, error: existingError} = await supabase
        .from('admin_outreach_threads')
        .select('id, status, assigned_admin_user_id')
        .eq('id', input.threadId)
        .maybeSingle()

      if (existingError || !existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Outreach thread not found',
        })
      }

      const hasChanges = input.status !== undefined || input.assignedAdminUserId !== undefined
      if (!hasChanges) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No changes provided',
        })
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (input.status !== undefined) {
        updates.status = input.status
        updates.closed_at = input.status === 'closed' ? new Date().toISOString() : null
      }
      if (input.assignedAdminUserId !== undefined) {
        updates.assigned_admin_user_id = input.assignedAdminUserId
      }

      const {error} = await supabase
        .from('admin_outreach_threads')
        .update(updates)
        .eq('id', input.threadId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ADMIN_OUTREACH_THREAD_UPDATE,
        targetType: 'admin_outreach_thread',
        targetId: input.threadId,
        metadata: {
          previousStatus: existing.status,
          previousAssignedAdminUserId: existing.assigned_admin_user_id,
          updates,
        },
      })

      return {success: true}
    }),

  /**
   * List admin outreach messages.
   */
  listOutreachMessages: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(200),
        offset: z.number().min(0).default(0),
        search: z.string().trim().max(200).optional(),
        channel: outreachChannelSchema.optional(),
        status: outreachMessageStatusSchema.optional(),
        direction: outreachDirectionSchema.optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('admin_outreach_messages')
        .select(`
          id,
          thread_id,
          lead_id,
          channel,
          direction,
          provider,
          provider_message_id,
          template_id,
          subject,
          body,
          status,
          error_code,
          error_message,
          scheduled_at,
          sent_at,
          created_at,
          updated_at,
          thread:admin_outreach_threads(id, external_thread_id, status),
          lead:admin_outreach_leads(id, target_type, target_name, target_slug, contact_identifier)
        `)
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (input.channel) query = query.eq('channel', input.channel)
      if (input.status) query = query.eq('direction', 'outbound').eq('status', input.status)
      if (input.direction) query = query.eq('direction', input.direction)

      if (input.search?.trim()) {
        const escapedSearch = input.search.trim().replaceAll('%', '\\%').replaceAll('_', '\\_')
        query = query.or(
          `subject.ilike.%${escapedSearch}%,body.ilike.%${escapedSearch}%,provider_message_id.ilike.%${escapedSearch}%`,
        )
      }

      const {data, error} = await query
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return (data || []).map((message) => (
        message.direction === 'inbound'
          ? {...message, status: null}
          : message
      ))
    }),

  /**
   * List all messages for a specific outreach thread in chronological order.
   */
  listOutreachThreadMessages: adminProcedure
    .input(
      z.object({
        threadId: dbUuidSchema,
        limit: z.number().min(1).max(1000).default(500),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data, error} = await supabase
        .from('admin_outreach_messages')
        .select(`
          id,
          thread_id,
          lead_id,
          channel,
          direction,
          provider,
          provider_message_id,
          template_id,
          subject,
          body,
          status,
          error_code,
          error_message,
          scheduled_at,
          sent_at,
          created_at,
          updated_at,
          lead:admin_outreach_leads(id, target_name, target_slug, contact_identifier)
        `)
        .eq('thread_id', input.threadId)
        .order('created_at', {ascending: true})
        .range(input.offset, input.offset + input.limit - 1)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return (data || []).map((message) => (
        message.direction === 'inbound'
          ? {...message, status: null}
          : message
      ))
    }),

  /**
   * Create a queued outbound outreach message manually from admin.
   */
  createOutreachMessage: adminProcedure
    .input(
      z.object({
        leadId: dbUuidSchema.optional(),
        gameName: z.string().trim().max(200).optional().nullable(),
        studioName: z.string().trim().max(200).optional().nullable(),
        targetSlug: z.string().trim().max(150).optional().nullable(),
        contactEmail: z.string().trim().email().max(320).optional().nullable(),
        contactDisplayName: z.string().trim().max(200).optional().nullable(),
        subject: z.string().trim().min(1).max(300),
        body: z.string().trim().min(1).max(20000),
        provider: z.string().trim().min(1).max(80).default('resend'),
        templateId: z.string().trim().max(120).nullable().optional(),
        scheduledAt: z.string().datetime().nullable().optional(),
      }).superRefine((value, ctx) => {
        if (!value.leadId) {
          if (!value.contactEmail) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'contactEmail is required when leadId is not provided',
              path: ['contactEmail'],
            })
          }
          if (!value.gameName && !value.studioName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'gameName or studioName is required when leadId is not provided',
              path: ['gameName'],
            })
          }
        }
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const now = new Date().toISOString()
      const scheduledAt = input.scheduledAt || now

      let lead: {
        id: string
        target_name: string
        channel: 'email' | 'discord' | 'twitter'
        contact_identifier: string
        status: string
        is_blocked: boolean
      } | null = null

      if (input.leadId) {
        const {data: existingLead, error: leadError} = await supabase
          .from('admin_outreach_leads')
          .select('id, target_name, channel, contact_identifier, status, is_blocked')
          .eq('id', input.leadId)
          .maybeSingle()

        if (leadError || !existingLead) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Outreach lead not found',
          })
        }
        lead = existingLead
      } else {
        const gameName = input.gameName?.trim() || ''
        const studioName = input.studioName?.trim() || ''
        const contactEmail = input.contactEmail?.trim() || ''
        const targetType: 'game' | 'studio' = gameName ? 'game' : 'studio'
        const targetName = gameName || studioName
        const notes = targetType === 'game' && studioName
          ? `Studio: ${studioName}`
          : null

        const {data: existingLead} = await supabase
          .from('admin_outreach_leads')
          .select('id, target_name, channel, contact_identifier, status, is_blocked')
          .eq('channel', 'email')
          .eq('contact_identifier', contactEmail)
          .eq('target_name', targetName)
          .order('created_at', {ascending: false})
          .limit(1)
          .maybeSingle()

        if (existingLead) {
          lead = existingLead
        } else {
          const {data: newLead, error: insertLeadError} = await supabase
            .from('admin_outreach_leads')
            .insert({
              target_type: targetType,
              target_name: targetName,
              target_slug: input.targetSlug?.trim() || null,
              channel: 'email',
              contact_identifier: contactEmail,
              contact_display_name: input.contactDisplayName?.trim() || null,
              source: 'manual',
              confidence_score: 70,
              status: 'queued',
              is_blocked: false,
              notes,
              next_action_at: scheduledAt,
              created_at: now,
              updated_at: now,
            })
            .select('id, target_name, channel, contact_identifier, status, is_blocked')
            .single()

          if (insertLeadError || !newLead) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: insertLeadError?.message || 'Failed to create outreach lead',
            })
          }
          lead = newLead
        }
      }

      if (!lead) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resolve outreach lead',
        })
      }

      if (lead.is_blocked) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot queue messages for blocked leads',
        })
      }

      const messageChannel = lead.channel
      const supportsManualQueueWithoutLead = messageChannel === 'email'
      if (!input.leadId && !supportsManualQueueWithoutLead) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Manual queue without leadId currently supports email only',
        })
      }

      const {data: existingThread, error: threadFetchError} = await supabase
        .from('admin_outreach_threads')
        .select('id, status')
        .eq('lead_id', lead.id)
        .eq('channel', messageChannel)
        .maybeSingle()

      if (threadFetchError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: threadFetchError.message,
        })
      }

      let threadId = existingThread?.id ?? null
      if (!threadId) {
        const {data: newThread, error: threadInsertError} = await supabase
          .from('admin_outreach_threads')
          .insert({
            lead_id: lead.id,
            channel: messageChannel,
            status: 'open',
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .single()

        if (threadInsertError || !newThread) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: threadInsertError?.message || 'Failed to create outreach thread',
          })
        }
        threadId = newThread.id
      }

      const {data: createdMessage, error: messageError} = await supabase
        .from('admin_outreach_messages')
        .insert({
          thread_id: threadId,
          lead_id: lead.id,
          channel: messageChannel,
          direction: 'outbound',
          provider: input.provider.trim(),
          template_id: input.templateId || null,
          subject: input.subject.trim(),
          body: input.body.trim(),
          status: 'queued',
          scheduled_at: scheduledAt,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single()

      if (messageError || !createdMessage) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: messageError?.message || 'Failed to create outreach message',
        })
      }

      await supabase
        .from('admin_outreach_events')
        .insert({
          message_id: createdMessage.id,
          thread_id: threadId,
          lead_id: lead.id,
          provider: input.provider.trim(),
          event_type: 'manual_queued',
          payload_json: {
            source: 'admin',
            scheduled_at: scheduledAt,
            contact_identifier: lead.contact_identifier,
          },
          occurred_at: now,
          created_at: now,
        })

      await supabase
        .from('admin_outreach_leads')
        .update({
          status: lead.status === 'new' ? 'queued' : lead.status,
          next_action_at: scheduledAt,
          updated_at: now,
        })
        .eq('id', lead.id)

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ADMIN_OUTREACH_MESSAGE_CREATE,
        targetType: 'admin_outreach_message',
        targetId: createdMessage.id,
        metadata: {
          leadId: lead.id,
          threadId,
          provider: input.provider.trim(),
          scheduledAt,
          targetName: lead.target_name,
        },
      })

      return {success: true, messageId: createdMessage.id}
    }),

  /**
   * Delete an outbound queued outreach message.
   */
  deleteOutreachQueuedMessage: adminProcedure
    .input(
      z.object({
        messageId: dbUuidSchema,
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: existing, error: existingError} = await supabase
        .from('admin_outreach_messages')
        .select('id, thread_id, lead_id, direction, provider, status, scheduled_at')
        .eq('id', input.messageId)
        .maybeSingle()

      if (existingError || !existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Outreach message not found',
        })
      }

      if (existing.direction !== 'outbound') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only outbound messages can be deleted',
        })
      }

      if (existing.status !== 'queued') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only queued messages can be deleted',
        })
      }

      const {error: deleteError} = await supabase
        .from('admin_outreach_messages')
        .delete()
        .eq('id', input.messageId)

      if (deleteError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: deleteError.message,
        })
      }

      const now = new Date().toISOString()
      await supabase
        .from('admin_outreach_events')
        .insert({
          message_id: null,
          thread_id: existing.thread_id,
          lead_id: existing.lead_id,
          provider: existing.provider || 'admin',
          event_type: 'manual_deleted',
          payload_json: {
            deleted_message_id: existing.id,
            previous_status: existing.status,
            scheduled_at: existing.scheduled_at,
          },
          occurred_at: now,
          created_at: now,
        })

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ADMIN_OUTREACH_MESSAGE_DELETE,
        targetType: 'admin_outreach_message',
        targetId: input.messageId,
        metadata: {
          previousStatus: existing.status,
          threadId: existing.thread_id,
          leadId: existing.lead_id,
          provider: existing.provider,
        },
      })

      return {success: true}
    }),

  /**
   * Retry a failed outbound outreach message.
   */
  retryOutreachMessage: adminProcedure
    .input(
      z.object({
        messageId: dbUuidSchema,
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: existing, error: existingError} = await supabase
        .from('admin_outreach_messages')
        .select('id, thread_id, lead_id, direction, provider, status')
        .eq('id', input.messageId)
        .maybeSingle()

      if (existingError || !existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Outreach message not found',
        })
      }

      if (existing.direction !== 'outbound') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only outbound messages can be retried',
        })
      }

      const now = new Date().toISOString()
      const {error: updateError} = await supabase
        .from('admin_outreach_messages')
        .update({
          status: 'queued',
          scheduled_at: now,
          sent_at: null,
          error_code: null,
          error_message: null,
          updated_at: now,
        })
        .eq('id', input.messageId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError.message,
        })
      }

      await supabase
        .from('admin_outreach_events')
        .insert({
          message_id: existing.id,
          thread_id: existing.thread_id,
          lead_id: existing.lead_id,
          provider: existing.provider || 'admin',
          event_type: 'retry_queued',
          payload_json: {
            previous_status: existing.status,
            action: 'retry',
          },
          occurred_at: now,
          created_at: now,
        })

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ADMIN_OUTREACH_MESSAGE_RETRY,
        targetType: 'admin_outreach_message',
        targetId: input.messageId,
        metadata: {
          previousStatus: existing.status,
          provider: existing.provider,
        },
      })

      return {success: true}
    }),

  /**
   * List outreach provider events.
   */
  listOutreachEvents: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(200),
        offset: z.number().min(0).default(0),
        provider: z.string().trim().max(80).optional(),
        eventType: z.string().trim().max(80).optional(),
        search: z.string().trim().max(200).optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('admin_outreach_events')
        .select(`
          id,
          message_id,
          thread_id,
          lead_id,
          provider,
          provider_event_id,
          event_type,
          occurred_at,
          payload_json,
          created_at,
          message:admin_outreach_messages(id, status, direction, channel),
          lead:admin_outreach_leads(id, target_type, target_game_id, target_studio_id, target_name, target_slug, contact_identifier)
        `)
        .order('occurred_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (input.provider) query = query.eq('provider', input.provider)
      if (input.eventType) query = query.eq('event_type', input.eventType)
      if (input.search?.trim()) {
        const escapedSearch = input.search.trim().replaceAll('%', '\\%').replaceAll('_', '\\_')
        query = query.ilike('provider_event_id', `%${escapedSearch}%`)
      }

      const {data, error} = await query
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      const rawItems = data || []
      if (rawItems.length === 0) return rawItems

      const leadsByRow = rawItems
        .map((event, index) => ({
          index,
          lead: Array.isArray(event.lead) ? event.lead[0] : event.lead,
        }))
        .filter((item): item is {index: number; lead: NonNullable<typeof item.lead>} => Boolean(item.lead))

      const resolvedLeads = await resolveOutreachTargetSlugs({
        supabase,
        targets: leadsByRow.map((item) => item.lead),
        errorMessage: 'Failed to enrich outreach event slugs',
      })

      const resolvedLeadByRowIndex = new Map(
        leadsByRow.map((item, index) => [item.index, resolvedLeads[index]] as const),
      )

      return rawItems.map((event, index) => {
        const lead = Array.isArray(event.lead) ? event.lead[0] : event.lead
        const resolvedLead = resolvedLeadByRowIndex.get(index)

        if (!lead || !resolvedLead) return event
        return {
          ...event,
          lead: {
            ...lead,
            ...resolvedLead,
          },
        }
      })
    }),
})
