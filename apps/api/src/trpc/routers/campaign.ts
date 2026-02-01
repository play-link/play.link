import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'

const EDIT_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MEMBER]

async function verifyGameAccess(
  supabase: any,
  userId: string,
  gameId: string,
) {
  const {data: game} = await supabase
    .from('games')
    .select('owner_studio_id')
    .eq('id', gameId)
    .single()

  if (!game) {
    throw new TRPCError({code: 'NOT_FOUND', message: 'Game not found'})
  }

  const {data: member} = await supabase
    .from('studio_members')
    .select('role')
    .eq('studio_id', game.owner_studio_id)
    .eq('user_id', userId)
    .single()

  if (!member || !EDIT_ROLES.includes(member.role as StudioRoleType)) {
    throw new TRPCError({code: 'FORBIDDEN', message: 'No access to this game'})
  }

  return game
}

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens',
  )

const dateRangeInput = z.object({
  campaignId: z.string().uuid(),
  days: z.enum(['7', '30', '90']).default('30'),
})

function getDateRange(days: string) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(days))
  return {from: from.toISOString(), to: to.toISOString()}
}

export const campaignRouter = router({
  listByStudio: protectedProcedure
    .input(z.object({studioId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

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

      // Get all game IDs for this studio
      const {data: games} = await supabase
        .from('games')
        .select('id, title, pages:game_pages(slug)')
        .eq('owner_studio_id', input.studioId)

      if (!games || games.length === 0) return []

      const gameIds = games.map((g: any) => g.id)

      const {data: campaigns, error} = await supabase
        .from('campaigns')
        .select('*')
        .in('game_id', gameIds)
        .order('created_at', {ascending: false})

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      // Attach game title to each campaign
      const gameMap = new Map(
        games.map((g: any) => [g.id, {title: g.title, slug: g.pages?.[0]?.slug}]),
      )

      return (campaigns || []).map((c: any) => ({
        ...c,
        game_title: gameMap.get(c.game_id)?.title || 'Unknown',
        game_slug: gameMap.get(c.game_id)?.slug || '',
      }))
    }),

  get: protectedProcedure
    .input(z.object({id: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data: campaign, error} = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', input.id)
        .single()

      if (error || !campaign) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Campaign not found'})
      }

      // Get game info for URL building
      const {data: game} = await supabase
        .from('games')
        .select('id, title, pages:game_pages(slug)')
        .eq('id', campaign.game_id)
        .single()

      return {
        ...campaign,
        game_title: game?.title || 'Unknown',
        game_slug: game?.pages?.[0]?.slug || '',
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        name: z.string().min(1).max(200),
        slug: slugSchema,
        destination: z.enum(['game_page', 'steam', 'epic', 'itch', 'custom']).default('game_page'),
        destinationUrl: z.string().url().optional(),
        utmSource: z.string().max(200).optional(),
        utmMedium: z.string().max(200).optional(),
        utmCampaign: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {data: campaign, error} = await supabase
        .from('campaigns')
        .insert({
          game_id: input.gameId,
          name: input.name,
          slug: input.slug,
          destination: input.destination,
          destination_url: input.destinationUrl || null,
          utm_source: input.utmSource || null,
          utm_medium: input.utmMedium || null,
          utm_campaign: input.utmCampaign || null,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A campaign with this slug already exists for this game',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return campaign
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        gameId: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        slug: slugSchema.optional(),
        destination: z.enum(['game_page', 'steam', 'epic', 'itch', 'custom']).optional(),
        destinationUrl: z.string().url().nullable().optional(),
        utmSource: z.string().max(200).nullable().optional(),
        utmMedium: z.string().max(200).nullable().optional(),
        utmCampaign: z.string().max(200).nullable().optional(),
        status: z.enum(['active', 'paused']).optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {id, gameId: _, ...fields} = input
      const updates: Record<string, unknown> = {}

      if (fields.name !== undefined) updates.name = fields.name
      if (fields.slug !== undefined) updates.slug = fields.slug
      if (fields.destination !== undefined) updates.destination = fields.destination
      if (fields.destinationUrl !== undefined) updates.destination_url = fields.destinationUrl
      if (fields.utmSource !== undefined) updates.utm_source = fields.utmSource
      if (fields.utmMedium !== undefined) updates.utm_medium = fields.utmMedium
      if (fields.utmCampaign !== undefined) updates.utm_campaign = fields.utmCampaign
      if (fields.status !== undefined) updates.status = fields.status

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({code: 'BAD_REQUEST', message: 'Nothing to update'})
      }

      const {data: campaign, error} = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A campaign with this slug already exists for this game',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return campaign
    }),

  delete: protectedProcedure
    .input(z.object({id: z.string().uuid(), gameId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {error} = await supabase
        .from('campaigns')
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

  // Analytics sub-procedures
  summary: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('campaign_summary', {
        p_campaign_id: input.campaignId,
        p_from: from,
        p_to: to,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data?.[0] || {total_clicks: 0, unique_visitors: 0}
    }),

  timeseries: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ctx, input}) => {
      const {supabase} = ctx
      const {from, to} = getDateRange(input.days)

      const {data, error} = await supabase.rpc('campaign_timeseries', {
        p_campaign_id: input.campaignId,
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

      const {data, error} = await supabase.rpc('campaign_top_referrers', {
        p_campaign_id: input.campaignId,
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

      const {data, error} = await supabase.rpc('campaign_top_countries', {
        p_campaign_id: input.campaignId,
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
})
