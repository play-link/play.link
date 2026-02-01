import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {protectedProcedure, router} from '../index'

const studioDateRangeInput = z.object({
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

export const studioAnalyticsRouter = router({
  summary: protectedProcedure
    .input(studioDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      if (input.gameId) {
        const {data, error} = await supabase.rpc('analytics_summary', {
          p_game_id: input.gameId,
          p_from: from,
          p_to: to,
        })
        if (error) {
          throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
        }
        // Transform per-game format to studio format
        const rows = (data || []) as {event_type: string; total: number; unique_visitors: number}[]
        const pageView = rows.find((r) => r.event_type === 'page_view')
        const linkClick = rows.find((r) => r.event_type === 'link_click')
        const follow = rows.find((r) => r.event_type === 'subscribe')
        return [{
          page_views: pageView?.total || 0,
          unique_visitors: pageView?.unique_visitors || 0,
          link_clicks: linkClick?.total || 0,
          follows: follow?.total || 0,
        }]
      }

      const {data, error} = await supabase.rpc('studio_analytics_summary', {
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

  timeseries: protectedProcedure
    .input(studioDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      if (input.gameId) {
        const {data, error} = await supabase.rpc('analytics_timeseries', {
          p_game_id: input.gameId,
          p_from: from,
          p_to: to,
        })
        if (error) {
          throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
        }
        // Transform per-game format (day, event_type, total) to studio format (day, page_views, link_clicks, follows)
        const rows = (data || []) as {day: string; event_type: string; total: number}[]
        const byDay = new Map<string, {page_views: number; link_clicks: number; follows: number}>()
        for (const row of rows) {
          const entry = byDay.get(row.day) || {page_views: 0, link_clicks: 0, follows: 0}
          if (row.event_type === 'page_view') entry.page_views += row.total
          else if (row.event_type === 'link_click') entry.link_clicks += row.total
          else if (row.event_type === 'subscribe') entry.follows += row.total
          byDay.set(row.day, entry)
        }
        return Array.from(byDay.entries()).map(([day, vals]) => ({day, ...vals}))
      }

      const {data, error} = await supabase.rpc('studio_analytics_timeseries', {
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

  topGames: protectedProcedure
    .input(studioDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('studio_analytics_top_games', {
        p_studio_id: input.studioId,
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

  topLinks: protectedProcedure
    .input(studioDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)

      if (!input.gameId) {
        return []
      }

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

  topReferrers: protectedProcedure
    .input(studioDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      if (input.gameId) {
        const {data, error} = await supabase.rpc('analytics_top_referrers', {
          p_game_id: input.gameId,
          p_from: from,
          p_to: to,
          p_limit: 10,
        })
        if (error) {
          throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
        }
        return data || []
      }

      const {data, error} = await supabase.rpc(
        'studio_analytics_top_referrers',
        {
          p_studio_id: input.studioId,
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
    .input(studioDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      if (input.gameId) {
        const {data, error} = await supabase.rpc('analytics_top_countries', {
          p_game_id: input.gameId,
          p_from: from,
          p_to: to,
          p_limit: 10,
        })
        if (error) {
          throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
        }
        return data || []
      }

      const {data, error} = await supabase.rpc(
        'studio_analytics_top_countries',
        {
          p_studio_id: input.studioId,
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
    .input(studioDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc(
        'studio_analytics_top_platforms',
        {
          p_studio_id: input.studioId,
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
    .input(studioDateRangeInput)
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyStudioMembership(supabase, user.id, input.studioId)
      const {from, to} = getDateRange(input.days)

      if (input.gameId) {
        const {data, error} = await supabase.rpc('analytics_devices', {
          p_game_id: input.gameId,
          p_from: from,
          p_to: to,
        })
        if (error) {
          throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
        }
        return data || []
      }

      const {data, error} = await supabase.rpc('studio_analytics_devices', {
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
