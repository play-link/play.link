import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {OrgRoleType} from '@play/supabase-client'
import {OrgRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'

// Roles that can update an organization
const UPDATE_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN]

export const organizationRouter = router({
  /**
   * List organizations for current user
   */
  list: protectedProcedure.query(async ({ctx}) => {
    const {user, supabase} = ctx

    // Get organizations where user is a member
    const {data: memberships, error: memberError} = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)

    if (memberError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: memberError.message,
      })
    }

    if (!memberships || memberships.length === 0) {
      return []
    }

    // Get the actual organizations
    const orgIds = memberships.map((m) => m.organization_id)
    const {data: orgs, error: orgsError} = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIds)

    if (orgsError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: orgsError.message,
      })
    }

    // Add role to each org
    return (
      orgs?.map((org) => ({
        ...org,
        role: memberships.find((m) => m.organization_id === org.id)?.role,
      })) || []
    )
  }),

  /**
   * Create a new organization
   */
  create: protectedProcedure
    .input(z.object({slug: z.string().min(1), name: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Create organization
      const {data: org, error: orgError} = await supabase
        .from('organizations')
        .insert({slug: input.slug, name: input.name})
        .select()
        .single()

      if (orgError) {
        if (orgError.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Organization slug already exists',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: orgError.message,
        })
      }

      // Add creator as OWNER
      const {error: memberError} = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: OrgRole.OWNER,
        })

      if (memberError) {
        // Rollback: delete the org if we couldn't add the member
        await supabase.from('organizations').delete().eq('id', org.id)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add owner to organization',
        })
      }

      return org
    }),

  /**
   * Update an organization
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        slug: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is OWNER or ADMIN
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', input.id)
        .eq('user_id', user.id)
        .single()

      if (!member || !UPDATE_ROLES.includes(member.role as OrgRoleType)) {
        throw new TRPCError({code: 'FORBIDDEN'})
      }

      // Build update object
      const updates: Record<string, string> = {}
      if (input.slug) updates.slug = input.slug
      if (input.name) updates.name = input.name

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nothing to update',
        })
      }

      const {data: org, error} = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Organization slug already exists',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return org
    }),

  /**
   * Delete an organization
   */
  delete: protectedProcedure
    .input(z.object({id: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is OWNER
      const {data: member} = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', input.id)
        .eq('user_id', user.id)
        .single()

      if (!member || member.role !== OrgRole.OWNER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the owner can delete an organization',
        })
      }

      const {error} = await supabase
        .from('organizations')
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
