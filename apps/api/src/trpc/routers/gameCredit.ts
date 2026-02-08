import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'
import {verifyGameAccess} from '../lib/verify-access'

// Roles that can manage game credits
const MANAGE_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]

// Credit role enum matching DB
const CREDIT_ROLES = [
  'DEVELOPER',
  'PUBLISHER',
  'PORTING',
  'MARKETING',
  'SUPPORT',
] as const

export const gameCreditRouter = router({
  /**
   * List credits for a game
   */
  list: protectedProcedure
    .input(z.object({gameId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {data: credits, error} = await supabase
        .from('game_credits')
        .select(
          `
          id,
          role,
          custom_name,
          studio_id,
          studios (
            id,
            slug,
            name,
            avatar_url
          )
        `,
        )
        .eq('game_id', input.gameId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return credits || []
    }),

  /**
   * Add a credit to a game
   * Must be OWNER or ADMIN of the game's owner studio
   */
  create: protectedProcedure
    .input(
      z
        .object({
          gameId: z.string().uuid(),
          studioId: z.string().uuid().optional(),
          customName: z.string().min(1).max(200).optional(),
          role: z.enum(CREDIT_ROLES),
        })
        .refine((data) => data.studioId || data.customName, {
          message: 'Either studioId or customName must be provided',
        }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get the game to check ownership
      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('owner_studio_id')
        .eq('id', input.gameId)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', game.owner_studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !MANAGE_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to add credits to this game',
        })
      }

      // If linking to a studio, verify it exists
      if (input.studioId) {
        const {data: studio} = await supabase
          .from('studios')
          .select('id')
          .eq('id', input.studioId)
          .single()

        if (!studio) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Studio not found',
          })
        }
      }

      // Create the credit
      const {data: credit, error} = await supabase
        .from('game_credits')
        .insert({
          game_id: input.gameId,
          studio_id: input.studioId || null,
          custom_name: input.customName || null,
          role: input.role,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_CREDIT_ADD,
        studioId: game.owner_studio_id,
        targetType: 'game_credit',
        targetId: String(credit.id),
        metadata: {
          gameId: input.gameId,
          role: input.role,
          studioId: input.studioId,
          customName: input.customName,
        },
      })

      return credit
    }),

  /**
   * Update a game credit
   */
  update: protectedProcedure
    .input(
      z
        .object({
          id: z.number(),
          studioId: z.string().uuid().optional().nullable(),
          customName: z.string().min(1).max(200).optional().nullable(),
          role: z.enum(CREDIT_ROLES).optional(),
        })
        .refine(
          (data) =>
            data.studioId !== null ||
            data.customName !== null ||
            data.role !== undefined,
          {
            message: 'At least one field must be provided',
          },
        ),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {id, ...updates} = input

      // Get the credit and its game
      const {data: credit, error: creditError} = await supabase
        .from('game_credits')
        .select('game_id')
        .eq('id', id)
        .single()

      if (creditError || !credit) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Credit not found',
        })
      }

      // Get the game to check ownership
      const {data: game} = await supabase
        .from('games')
        .select('owner_studio_id')
        .eq('id', credit.game_id)
        .single()

      if (!game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', game.owner_studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !MANAGE_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit credits for this game',
        })
      }

      // Build update object
      const dbUpdates: Record<string, unknown> = {}
      if (updates.studioId !== undefined)
        dbUpdates.studio_id = updates.studioId
      if (updates.customName !== undefined)
        dbUpdates.custom_name = updates.customName
      if (updates.role !== undefined) dbUpdates.role = updates.role

      // Validate constraint: either studio or custom_name must exist
      const finalStudioId =
        updates.studioId !== undefined
          ? updates.studioId
          : undefined
      const finalCustomName =
        updates.customName !== undefined ? updates.customName : undefined

      if (finalStudioId === null && finalCustomName === null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either studioId or customName must be set',
        })
      }

      const {data: updatedCredit, error} = await supabase
        .from('game_credits')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_CREDIT_UPDATE,
        studioId: game.owner_studio_id,
        targetType: 'game_credit',
        targetId: String(id),
        metadata: {gameId: credit.game_id, changes: dbUpdates},
      })

      return updatedCredit
    }),

  /**
   * Delete a game credit
   */
  delete: protectedProcedure
    .input(z.object({id: z.number()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get the credit and its game
      const {data: credit, error: creditError} = await supabase
        .from('game_credits')
        .select('game_id')
        .eq('id', input.id)
        .single()

      if (creditError || !credit) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Credit not found',
        })
      }

      // Get the game to check ownership
      const {data: game} = await supabase
        .from('games')
        .select('owner_studio_id')
        .eq('id', credit.game_id)
        .single()

      if (!game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', game.owner_studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !MANAGE_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete credits for this game',
        })
      }

      const {error} = await supabase
        .from('game_credits')
        .delete()
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_CREDIT_REMOVE,
        studioId: game.owner_studio_id,
        targetType: 'game_credit',
        targetId: String(input.id),
        metadata: {gameId: credit.game_id},
      })

      return {success: true}
    }),
})
