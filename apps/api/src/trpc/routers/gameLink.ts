import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {verifyGameAccess} from '../lib/verify-access'

// Roles that can edit links (Viewer can only view)
const EDIT_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]

const linkTypeEnum = z.enum([
  'steam',
  'itch',
  'epic',
  'discord',
  'youtube',
  'website',
  'demo',
  'nintendo-switch',
  'playstation',
  'xbox',
  'app-store',
  'google-play',
])

const linkCategoryEnum = z.enum(['store', 'community', 'media', 'other', 'platform'])

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
        category: linkCategoryEnum,
        type: linkTypeEnum,
        label: z.string().min(1).max(100),
        url: z.string().url().optional().nullable(),
        position: z.number().int().min(0).default(0),
        comingSoon: z.boolean().optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

      const {data: link, error} = await supabase
        .from('game_links')
        .insert({
          game_id: input.gameId,
          category: input.category,
          type: input.type,
          label: input.label,
          url: input.url || null,
          position: input.position,
          coming_soon: input.comingSoon ?? false,
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
        category: linkCategoryEnum.optional(),
        type: linkTypeEnum.optional(),
        label: z.string().min(1).max(100).optional(),
        url: z.string().url().optional().nullable(),
        position: z.number().int().min(0).optional(),
        comingSoon: z.boolean().optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

      const {id, gameId: _, comingSoon, ...rest} = input
      const updates: Record<string, unknown> = {...rest}
      if (comingSoon !== undefined) {
        updates.coming_soon = comingSoon
      }

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
      await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

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
      await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

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
