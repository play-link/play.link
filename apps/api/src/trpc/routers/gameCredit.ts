import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {OrgRoleType} from '@play/supabase-client'
import {OrgRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

// Roles that can manage game credits
const MANAGE_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN]

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
      const {supabase} = ctx

      const {data: credits, error} = await supabase
        .from('game_credits')
        .select(
          `
          id,
          role,
          custom_name,
          organization_id,
          organizations (
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
   * Must be OWNER or ADMIN of the game's owner organization
   */
  create: protectedProcedure
    .input(
      z
        .object({
          gameId: z.string().uuid(),
          organizationId: z.string().uuid().optional(),
          customName: z.string().min(1).max(200).optional(),
          role: z.enum(CREDIT_ROLES),
        })
        .refine((data) => data.organizationId || data.customName, {
          message: 'Either organizationId or customName must be provided',
        }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get the game to check ownership
      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('owner_organization_id')
        .eq('id', input.gameId)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner org
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', game.owner_organization_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !MANAGE_ROLES.includes(member.role as OrgRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to add credits to this game',
        })
      }

      // If linking to an org, verify it exists
      if (input.organizationId) {
        const {data: org} = await supabase
          .from('organizations')
          .select('id')
          .eq('id', input.organizationId)
          .single()

        if (!org) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Organization not found',
          })
        }
      }

      // Create the credit
      const {data: credit, error} = await supabase
        .from('game_credits')
        .insert({
          game_id: input.gameId,
          organization_id: input.organizationId || null,
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
        organizationId: game.owner_organization_id,
        targetType: 'game_credit',
        targetId: String(credit.id),
        metadata: {
          gameId: input.gameId,
          role: input.role,
          organizationId: input.organizationId,
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
          organizationId: z.string().uuid().optional().nullable(),
          customName: z.string().min(1).max(200).optional().nullable(),
          role: z.enum(CREDIT_ROLES).optional(),
        })
        .refine(
          (data) =>
            data.organizationId !== null ||
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
        .select('owner_organization_id')
        .eq('id', credit.game_id)
        .single()

      if (!game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner org
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', game.owner_organization_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !MANAGE_ROLES.includes(member.role as OrgRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit credits for this game',
        })
      }

      // Build update object
      const dbUpdates: Record<string, unknown> = {}
      if (updates.organizationId !== undefined)
        dbUpdates.organization_id = updates.organizationId
      if (updates.customName !== undefined)
        dbUpdates.custom_name = updates.customName
      if (updates.role !== undefined) dbUpdates.role = updates.role

      // Validate constraint: either org or custom_name must exist
      const finalOrgId =
        updates.organizationId !== undefined
          ? updates.organizationId
          : undefined
      const finalCustomName =
        updates.customName !== undefined ? updates.customName : undefined

      if (finalOrgId === null && finalCustomName === null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either organizationId or customName must be set',
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
        organizationId: game.owner_organization_id,
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
        .select('owner_organization_id')
        .eq('id', credit.game_id)
        .single()

      if (!game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner org
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', game.owner_organization_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !MANAGE_ROLES.includes(member.role as OrgRoleType)) {
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
        organizationId: game.owner_organization_id,
        targetType: 'game_credit',
        targetId: String(input.id),
        metadata: {gameId: credit.game_id},
      })

      return {success: true}
    }),
})
