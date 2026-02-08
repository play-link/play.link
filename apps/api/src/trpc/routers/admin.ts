import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {adminProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

export const adminRouter = router({
  /**
   * Get dashboard summary counts
   */
  getDashboardSummary: adminProcedure.query(async ({ctx}) => {
    const {supabase} = ctx

    // Count pending change requests
    const {count: pendingRequests} = await supabase
      .from('change_requests')
      .select('*', {count: 'exact', head: true})
      .eq('status', 'pending')

    // Count unverified studios
    const {count: unverifiedStudios} = await supabase
      .from('studios')
      .select('*', {count: 'exact', head: true})
      .eq('is_verified', false)

    // Count unverified games
    const {count: unverifiedGames} = await supabase
      .from('games')
      .select('*', {count: 'exact', head: true})
      .eq('is_verified', false)

    return {
      pendingRequests: pendingRequests ?? 0,
      unverifiedStudios: unverifiedStudios ?? 0,
      unverifiedGames: unverifiedGames ?? 0,
    }
  }),

  /**
   * List all studios with verification status
   */
  listStudios: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        isVerified: z.boolean().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('studios')
        .select('id, name, slug, avatar_url, is_verified, created_at')
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (input.isVerified !== undefined) {
        query = query.eq('is_verified', input.isVerified)
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
   * List all games with verification status
   */
  listGames: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        isVerified: z.boolean().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

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
            slug
          )
        `,
        )
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (input.isVerified !== undefined) {
        query = query.eq('is_verified', input.isVerified)
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
   * Set studio verification status
   */
  setStudioVerified: adminProcedure
    .input(
      z.object({
        studioId: z.string().uuid(),
        isVerified: z.boolean(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: studio, error: fetchError} = await supabase
        .from('studios')
        .select('id, name, slug, is_verified')
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
          is_verified: input.isVerified,
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
        action: input.isVerified
          ? AuditAction.STUDIO_VERIFY
          : AuditAction.STUDIO_UNVERIFY,
        studioId: input.studioId,
        targetType: 'studio',
        targetId: input.studioId,
        metadata: {
          name: studio.name,
          slug: studio.slug,
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
        gameId: z.string().uuid(),
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

      const {error} = await supabase
        .from('games')
        .update({
          is_verified: input.isVerified,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.gameId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
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
})
