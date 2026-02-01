import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {protectedProcedure, router} from '../index'

const audienceInput = z.object({
  studioId: z.string().uuid(),
  days: z.enum(['7', '30', '90']).default('30'),
  gameId: z.string().uuid().optional(),
})

function getDateRange(days: string) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(days))
  return {from: from.toISOString(), to: to.toISOString()}
}

async function verifyStudioMembership(
  supabase: any,
  userId: string,
  studioId: string,
) {
  const {data: member} = await supabase
    .from('studio_members')
    .select('role')
    .eq('studio_id', studioId)
    .eq('user_id', userId)
    .single()

  if (!member) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this studio',
    })
  }
}

export const audienceRouter = router({
  summary: protectedProcedure
    .input(audienceInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('audience_summary', {
        p_studio_id: input.studioId,
        p_from: from,
        p_to: to,
        p_game_id: input.gameId || null,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data?.[0] || {
        total_subscribers: 0,
        subscribers_gained: 0,
        unsubscribes: 0,
        net_growth: 0,
        confirmed_count: 0,
        pending_count: 0,
      }
    }),

  timeseries: protectedProcedure
    .input(audienceInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('audience_timeseries', {
        p_studio_id: input.studioId,
        p_from: from,
        p_to: to,
        p_game_id: input.gameId || null,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  byGame: protectedProcedure
    .input(z.object({
      studioId: z.string().uuid(),
      days: z.enum(['7', '30', '90']).default('30'),
    }))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('audience_by_game', {
        p_studio_id: input.studioId,
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
