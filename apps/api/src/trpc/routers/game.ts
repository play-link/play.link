import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {OrgRoleType} from '@play/supabase-client'
import {OrgRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

// Roles that can edit games
const EDIT_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER]
// Roles that can delete games
const DELETE_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN]

// Slug validation: lowercase letters, numbers, hyphens only
const slugSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only (e.g., my-game-name)',
  )

export const gameRouter = router({
  /**
   * Check if a game slug is available
   */
  checkSlug: protectedProcedure
    .input(z.object({slug: slugSchema}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data, error} = await supabase
        .from('games')
        .select('id')
        .eq('slug', input.slug)
        .maybeSingle()

      if (error) {
        return {available: false, error: error.message}
      }

      return {available: data === null}
    }),

  /**
   * List games for an organization
   */
  list: protectedProcedure
    .input(z.object({organizationId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is member of org
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', input.organizationId)
        .eq('user_id', user.id)
        .single()

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this organization',
        })
      }

      const {data: games, error} = await supabase
        .from('games')
        .select('*')
        .eq('owner_organization_id', input.organizationId)
        .order('created_at', {ascending: false})

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return games || []
    }),

  /**
   * Get a game by ID
   */
  get: protectedProcedure
    .input(z.object({id: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data: game, error} = await supabase
        .from('games')
        .select('*')
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      return game
    }),

  /**
   * Create a new game
   */
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        slug: slugSchema,
        title: z.string().min(1).max(200),
        summary: z.string().optional(),
        status: z
          .enum(['DRAFT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED'])
          .default('DRAFT'),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is member of org
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', input.organizationId)
        .eq('user_id', user.id)
        .single()

      if (!member || !EDIT_ROLES.includes(member.role as OrgRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create games',
        })
      }

      const {data: game, error} = await supabase
        .from('games')
        .insert({
          owner_organization_id: input.organizationId,
          slug: input.slug,
          title: input.title,
          summary: input.summary || null,
          status: input.status,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Game slug already exists',
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
        action: AuditAction.GAME_CREATE,
        organizationId: input.organizationId,
        targetType: 'game',
        targetId: game.id,
        metadata: {slug: game.slug, title: game.title},
      })

      return game
    }),

  /**
   * Update a game
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        slug: slugSchema.optional(),
        title: z.string().min(1).max(200).optional(),
        summary: z.string().optional().nullable(),
        description: z.any().optional().nullable(), // JSONB
        status: z
          .enum(['DRAFT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED'])
          .optional(),
        releaseDate: z
          .string()
          .date()
          .or(z.string().datetime())
          .optional()
          .nullable(),
        genres: z.array(z.string()).optional(),
        coverUrl: z.string().url().or(z.literal('')).optional().nullable(),
        headerUrl: z.string().url().or(z.literal('')).optional().nullable(),
        trailerUrl: z.string().url().or(z.literal('')).optional().nullable(),
        themeColor: z.string().max(20).optional().nullable(),
        platforms: z.any().optional(), // JSONB
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {id, ...updates} = input

      // Get the game to check ownership
      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('owner_organization_id')
        .eq('id', id)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is member of owner org
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', game.owner_organization_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !EDIT_ROLES.includes(member.role as OrgRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this game',
        })
      }

      // Build update object with snake_case keys
      const dbUpdates: Record<string, unknown> = {}
      if (updates.slug !== undefined) dbUpdates.slug = updates.slug
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.summary !== undefined) dbUpdates.summary = updates.summary
      if (updates.description !== undefined)
        dbUpdates.description = updates.description
      if (updates.status !== undefined) dbUpdates.status = updates.status
      if (updates.releaseDate !== undefined)
        dbUpdates.release_date = updates.releaseDate
      if (updates.genres !== undefined) dbUpdates.genres = updates.genres
      if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl
      if (updates.headerUrl !== undefined)
        dbUpdates.header_url = updates.headerUrl
      if (updates.trailerUrl !== undefined)
        dbUpdates.trailer_url = updates.trailerUrl
      if (updates.themeColor !== undefined)
        dbUpdates.theme_color = updates.themeColor
      if (updates.platforms !== undefined)
        dbUpdates.platforms = updates.platforms

      if (Object.keys(dbUpdates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nothing to update',
        })
      }

      dbUpdates.updated_at = new Date().toISOString()

      const {data: updatedGame, error} = await supabase
        .from('games')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Game slug already exists',
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
        action: AuditAction.GAME_UPDATE,
        organizationId: game.owner_organization_id,
        targetType: 'game',
        targetId: id,
        metadata: {changes: dbUpdates},
      })

      return updatedGame
    }),

  /**
   * Delete a game
   */
  delete: protectedProcedure
    .input(z.object({id: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get the game to check ownership
      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('owner_organization_id, slug, title')
        .eq('id', input.id)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner org
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', game.owner_organization_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !DELETE_ROLES.includes(member.role as OrgRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this game',
        })
      }

      const {error} = await supabase.from('games').delete().eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_DELETE,
        organizationId: game.owner_organization_id,
        targetType: 'game',
        targetId: input.id,
        metadata: {slug: game.slug, title: game.title},
      })

      return {success: true}
    }),
})
