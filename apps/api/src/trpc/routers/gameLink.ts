import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {protectedProcedure, router} from '../index'
import {verifyGameAccess} from '../lib/verify-access'

export const gameLinkRouter = router({
  list: protectedProcedure
    .input(z.object({gameId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {data: links, error} = await supabase
        .from('game_links')
        .select('*')
        .eq('game_id', input.gameId)
        .order('position', {ascending: true})

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return links || []
    }),

  create: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        category: z.enum(['store', 'community', 'media', 'other']),
        type: z.enum([
          'steam',
          'itch',
          'epic',
          'discord',
          'youtube',
          'website',
          'demo',
        ]),
        label: z.string().min(1).max(100),
        url: z.string().url(),
        position: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {data: link, error} = await supabase
        .from('game_links')
        .insert({
          game_id: input.gameId,
          category: input.category,
          type: input.type,
          label: input.label,
          url: input.url,
          position: input.position,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return link
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        gameId: z.string().uuid(),
        category: z.enum(['store', 'community', 'media', 'other']).optional(),
        type: z
          .enum([
            'steam',
            'itch',
            'epic',
            'discord',
            'youtube',
            'website',
            'demo',
          ])
          .optional(),
        label: z.string().min(1).max(100).optional(),
        url: z.string().url().optional(),
        position: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {id, gameId: _, ...updates} = input

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({code: 'BAD_REQUEST', message: 'Nothing to update'})
      }

      const {data: link, error} = await supabase
        .from('game_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return link
    }),

  delete: protectedProcedure
    .input(z.object({id: z.string().uuid(), gameId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {error} = await supabase
        .from('game_links')
        .delete()
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return {success: true}
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        linkIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const updates = input.linkIds.map((id, index) =>
        supabase
          .from('game_links')
          .update({position: index})
          .eq('id', id)
          .eq('game_id', input.gameId),
      )

      await Promise.all(updates)

      return {success: true}
    }),
})
