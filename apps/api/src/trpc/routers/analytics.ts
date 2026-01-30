import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {protectedProcedure, router} from '../index'

const dateRangeInput = z.object({
  gameId: z.string().uuid(),
  days: z.enum(['7', '30', '90']).default('30'),
})

function getDateRange(days: string) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(days))
  return {from: from.toISOString(), to: to.toISOString()}
}

export const analyticsRouter = router({
  summary: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('analytics_summary', {
        p_game_id: input.gameId,
        p_from: from,
        p_to: to,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  timeseries: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('analytics_timeseries', {
        p_game_id: input.gameId,
        p_from: from,
        p_to: to,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  topReferrers: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('analytics_top_referrers', {
        p_game_id: input.gameId,
        p_from: from,
        p_to: to,
        p_limit: 10,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  topCountries: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('analytics_top_countries', {
        p_game_id: input.gameId,
        p_from: from,
        p_to: to,
        p_limit: 10,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  topLinks: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('analytics_top_links', {
        p_game_id: input.gameId,
        p_from: from,
        p_to: to,
        p_limit: 10,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  devices: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('analytics_devices', {
        p_game_id: input.gameId,
        p_from: from,
        p_to: to,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),
})
