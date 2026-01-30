import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {protectedProcedure, router} from '../index'

export const gameSubscriberRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data: subscribers, error, count} = await supabase
        .from('game_subscribers')
        .select('*', {count: 'exact'})
        .eq('game_id', input.gameId)
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return {subscribers: subscribers || [], total: count || 0}
    }),

  count: protectedProcedure
    .input(z.object({gameId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {count, error} = await supabase
        .from('game_subscribers')
        .select('*', {count: 'exact', head: true})
        .eq('game_id', input.gameId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return {count: count || 0}
    }),
})
