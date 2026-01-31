import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {protectedProcedure, router} from '../index'

const orgDateRangeInput = z.object({
  organizationId: z.string().uuid(),
  days: z.enum(['7', '30', '90']).default('30'),
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

export const orgAnalyticsRouter = router({
  summary: protectedProcedure
    .input(orgDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('org_analytics_summary', {
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

  timeseries: protectedProcedure
    .input(orgDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('org_analytics_timeseries', {
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

  topGames: protectedProcedure
    .input(orgDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('org_analytics_top_games', {
        p_org_id: input.organizationId,
        p_from: from,
        p_to: to,
        p_limit: 20,
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
    .input(orgDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc(
        'org_analytics_top_referrers',
        {
          p_org_id: input.organizationId,
          p_from: from,
          p_to: to,
          p_limit: 10,
        },
      )

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  topCountries: protectedProcedure
    .input(orgDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc(
        'org_analytics_top_countries',
        {
          p_org_id: input.organizationId,
          p_from: from,
          p_to: to,
          p_limit: 10,
        },
      )

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  topPlatforms: protectedProcedure
    .input(orgDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc(
        'org_analytics_top_platforms',
        {
          p_org_id: input.organizationId,
          p_from: from,
          p_to: to,
          p_limit: 10,
        },
      )

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  devices: protectedProcedure
    .input(orgDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyOrgMembership(supabase, user.id, input.organizationId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('org_analytics_devices', {
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
