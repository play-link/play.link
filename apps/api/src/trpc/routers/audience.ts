import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {protectedProcedure, router} from '../index'

const audienceInput = z.object({
  organizationId: z.string().uuid(),
  days: z.enum(['7', '30', '90']).default('30'),
  gameId: z.string().uuid().optional(),
})

function getDateRange(days: string) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(days))
  return {from: from.toISOString(), to: to.toISOString()}
}

async function verifyOrgMembership(
  supabase: any,
  userId: string,
  organizationId: string,
) {
  const {data: member} = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single()

  if (!member) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this organization',
    })
  }
}

export const audienceRouter = router({
  summary: protectedProcedure
    .input(audienceInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('audience_summary', {
        p_org_id: input.organizationId,
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
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('audience_timeseries', {
        p_org_id: input.organizationId,
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
      organizationId: z.string().uuid(),
      days: z.enum(['7', '30', '90']).default('30'),
    }))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('audience_by_game', {
        p_org_id: input.organizationId,
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
