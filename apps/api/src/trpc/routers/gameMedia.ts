import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {OrgRoleType} from '@play/supabase-client'
import {OrgRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'

const EDIT_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER]

async function verifyGameAccess(
  supabase: any,
  userId: string,
  gameId: string,
) {
  const {data: game} = await supabase
    .from('games')
    .select('owner_organization_id')
    .eq('id', gameId)
    .single()

  if (!game) {
    throw new TRPCError({code: 'NOT_FOUND', message: 'Game not found'})
  }

  const {data: member} = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', game.owner_organization_id)
    .eq('user_id', userId)
    .single()

  if (!member || !EDIT_ROLES.includes(member.role as OrgRoleType)) {
    throw new TRPCError({code: 'FORBIDDEN', message: 'No access to this game'})
  }

  return game
}

export const gameMediaRouter = router({
  list: protectedProcedure
    .input(z.object({gameId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data: media, error} = await supabase
        .from('game_media')
        .select('*')
        .eq('game_id', input.gameId)
        .order('position', {ascending: true})

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return media || []
    }),

  create: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        type: z.enum(['image', 'video']),
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional().nullable(),
        position: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {data: item, error} = await supabase
        .from('game_media')
        .insert({
          game_id: input.gameId,
          type: input.type,
          url: input.url,
          thumbnail_url: input.thumbnailUrl ?? null,
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

      return item
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        gameId: z.string().uuid(),
        type: z.enum(['image', 'video']).optional(),
        url: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional().nullable(),
        position: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {id, gameId: _, ...rest} = input

      const updates: Record<string, unknown> = {}
      if (rest.type !== undefined) updates.type = rest.type
      if (rest.url !== undefined) updates.url = rest.url
      if (rest.thumbnailUrl !== undefined) updates.thumbnail_url = rest.thumbnailUrl
      if (rest.position !== undefined) updates.position = rest.position

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({code: 'BAD_REQUEST', message: 'Nothing to update'})
      }

      const {data: item, error} = await supabase
        .from('game_media')
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

      return item
    }),

  delete: protectedProcedure
    .input(z.object({id: z.string().uuid(), gameId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {error} = await supabase
        .from('game_media')
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
})
