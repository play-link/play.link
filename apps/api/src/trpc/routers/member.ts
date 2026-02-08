import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

// Roles that can manage members
// Only owners can manage members (invite, remove, change roles)
const MANAGE_ROLES: StudioRoleType[] = [StudioRole.OWNER]

export const memberRouter = router({
  /**
   * List members of a studio
   */
  list: protectedProcedure
    .input(z.object({studioId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is a member of this studio
      const {data: membership} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this studio',
        })
      }

      // Get all members with their profiles
      const {data: members, error} = await supabase
        .from('studio_members')
        .select(
          `
          user_id,
          role,
          created_at,
          profiles:user_id (
            email,
            username,
            display_name,
            avatar_url
          )
        `,
        )
        .eq('studio_id', input.studioId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return members || []
    }),

  /**
   * Add a member to a studio
   */
  create: protectedProcedure
    .input(
      z.object({
        studioId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(['OWNER', 'MEMBER', 'VIEWER']).default('MEMBER'),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check current user has permission to add members
      const {data: currentMember} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (
        !currentMember ||
        !MANAGE_ROLES.includes(currentMember.role as StudioRoleType)
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to add members',
        })
      }

      // Cannot add OWNER if you're not OWNER
      if (input.role === 'OWNER' && currentMember.role !== StudioRole.OWNER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners can add other owners',
        })
      }

      // Check if user exists
      const {data: profile} = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', input.userId)
        .single()

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // Add member
      const {data: member, error} = await supabase
        .from('studio_members')
        .insert({
          studio_id: input.studioId,
          user_id: input.userId,
          role: input.role,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a member of this studio',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.MEMBER_ADD,
        studioId: input.studioId,
        targetType: 'member',
        targetId: input.userId,
        metadata: {role: input.role},
      })

      return member
    }),

  /**
   * Update a member's role
   */
  update: protectedProcedure
    .input(
      z.object({
        studioId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(['OWNER', 'MEMBER', 'VIEWER']),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check current user has permission
      const {data: currentMember} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (
        !currentMember ||
        !MANAGE_ROLES.includes(currentMember.role as StudioRoleType)
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update members',
        })
      }

      // Get target member's current role
      const {data: targetMember} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', input.userId)
        .single()

      if (!targetMember) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        })
      }

      // Only owners can modify owner roles
      if (
        (targetMember.role === StudioRole.OWNER || input.role === StudioRole.OWNER) &&
        currentMember.role !== StudioRole.OWNER
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners can modify owner roles',
        })
      }

      // Cannot demote yourself if you're the only owner
      if (
        input.userId === user.id &&
        targetMember.role === StudioRole.OWNER &&
        input.role !== StudioRole.OWNER
      ) {
        const {count} = await supabase
          .from('studio_members')
          .select('*', {count: 'exact', head: true})
          .eq('studio_id', input.studioId)
          .eq('role', 'OWNER')

        if (count === 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Cannot demote yourself as you are the only owner. Transfer ownership first.',
          })
        }
      }

      const {data: member, error} = await supabase
        .from('studio_members')
        .update({role: input.role})
        .eq('studio_id', input.studioId)
        .eq('user_id', input.userId)
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
        action: AuditAction.MEMBER_ROLE_CHANGE,
        studioId: input.studioId,
        targetType: 'member',
        targetId: input.userId,
        metadata: {oldRole: targetMember.role, newRole: input.role},
      })

      return member
    }),

  /**
   * Remove a member from a studio
   */
  delete: protectedProcedure
    .input(
      z.object({
        studioId: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check current user has permission (or is removing themselves)
      const isSelf = input.userId === user.id

      if (!isSelf) {
        const {data: currentMember} = await supabase
          .from('studio_members')
          .select('role')
          .eq('studio_id', input.studioId)
          .eq('user_id', user.id)
          .single()

        if (
          !currentMember ||
          !MANAGE_ROLES.includes(currentMember.role as StudioRoleType)
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to remove members',
          })
        }

        // Check target member exists and is not an owner (unless remover is owner)
        const {data: targetMember} = await supabase
          .from('studio_members')
          .select('role')
          .eq('studio_id', input.studioId)
          .eq('user_id', input.userId)
          .single()

        if (!targetMember) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          })
        }

        if (
          targetMember.role === StudioRole.OWNER &&
          currentMember.role !== StudioRole.OWNER
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only owners can remove other owners',
          })
        }
      }

      // If removing self as owner, check not the only owner
      if (isSelf) {
        const {data: selfMember} = await supabase
          .from('studio_members')
          .select('role')
          .eq('studio_id', input.studioId)
          .eq('user_id', user.id)
          .single()

        if (selfMember?.role === StudioRole.OWNER) {
          const {count} = await supabase
            .from('studio_members')
            .select('*', {count: 'exact', head: true})
            .eq('studio_id', input.studioId)
            .eq('role', 'OWNER')

          if (count === 1) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message:
                'Cannot leave as you are the only owner. Transfer ownership or delete the studio.',
            })
          }
        }
      }

      const {error} = await supabase
        .from('studio_members')
        .delete()
        .eq('studio_id', input.studioId)
        .eq('user_id', input.userId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.MEMBER_REMOVE,
        studioId: input.studioId,
        targetType: 'member',
        targetId: input.userId,
        metadata: {removedBySelf: isSelf},
      })

      return {success: true}
    }),
})
