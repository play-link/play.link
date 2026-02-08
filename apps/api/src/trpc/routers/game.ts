import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'
import {verifyGameAccess} from '../lib/verify-access'

// Roles that can edit games
const EDIT_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]
// Only owners can delete games
const DELETE_ROLES: StudioRoleType[] = [StudioRole.OWNER]

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
   * List games for a studio
   */
  list: protectedProcedure
    .input(z.object({studioId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is member of studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this studio',
        })
      }

      const {data: games, error} = await supabase
        .from('games')
        .select('*, pages:game_pages(*)')
        .eq('owner_studio_id', input.studioId)
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
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.id)

      const {data: game, error} = await supabase
        .from('games')
        .select('*, pages:game_pages(*)')
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
   * Create a new game (also creates a primary game_page)
   */
  create: protectedProcedure
    .input(
      z.object({
        studioId: z.string().uuid(),
        slug: slugSchema,
        title: z.string().min(1).max(200),
        summary: z.string().optional(),
        status: z
          .enum(['IN_DEVELOPMENT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED'])
          .default('IN_DEVELOPMENT'),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is member of studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (!member || !EDIT_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create games',
        })
      }

      // Insert game
      const {data: game, error: gameError} = await supabase
        .from('games')
        .insert({
          owner_studio_id: input.studioId,
          title: input.title,
          summary: input.summary || null,
          status: input.status,
        })
        .select()
        .single()

      if (gameError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: gameError.message,
        })
      }

      // Insert primary game_page with the slug
      const {error: pageError} = await supabase
        .from('game_pages')
        .insert({
          game_id: game.id,
          slug: input.slug,
          is_primary: true,
        })

      if (pageError) {
        // Rollback game if page creation fails
        await supabase.from('games').delete().eq('id', game.id)

        if (pageError.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Slug already exists',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: pageError.message,
        })
      }

      // Re-fetch with pages joined
      const {data: fullGame} = await supabase
        .from('games')
        .select('*, pages:game_pages(*)')
        .eq('id', game.id)
        .single()

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_CREATE,
        studioId: input.studioId,
        targetType: 'game',
        targetId: game.id,
        metadata: {slug: input.slug, title: game.title},
      })

      return fullGame!
    }),

  /**
   * Update a game (metadata only, no slug)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        summary: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        status: z
          .enum(['IN_DEVELOPMENT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED'])
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
        platforms: z
          .array(
            z.enum([
              'PC',
              'Mac',
              'Linux',
              'PS5',
              'Xbox Series',
              'Switch',
              'iOS',
              'Android',
            ]),
          )
          .optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {id, ...updates} = input

      // Get the game to check ownership
      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('owner_studio_id')
        .eq('id', id)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is member of owner studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', game.owner_studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !EDIT_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this game',
        })
      }

      // Build update object with snake_case keys
      const dbUpdates: Record<string, unknown> = {}
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
        .select('*, pages:game_pages(*)')
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
        action: AuditAction.GAME_UPDATE,
        studioId: game.owner_studio_id,
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
        .select('owner_studio_id, title')
        .eq('id', input.id)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', game.owner_studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !DELETE_ROLES.includes(member.role as StudioRoleType)) {
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
        studioId: game.owner_studio_id,
        targetType: 'game',
        targetId: input.id,
        metadata: {title: game.title},
      })

      return {success: true}
    }),
})
