import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {OrgRoleType} from '@play/supabase-client'
import {OrgRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

// Roles that can update an organization
const UPDATE_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN]

// Slug validation: lowercase letters, numbers, hyphens only
const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only',
  )

export const organizationRouter = router({
  /**
   * Check if an organization slug is available
   */
  checkSlug: protectedProcedure
    .input(z.object({slug: slugSchema}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data, error} = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', input.slug)
        .maybeSingle()

      if (error) {
        return {available: false, error: error.message}
      }

      return {available: data === null}
    }),

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
    .input(z.object({slug: slugSchema, name: z.string().min(1).max(100)}))
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

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ORGANIZATION_CREATE,
        organizationId: org.id,
        targetType: 'organization',
        targetId: org.id,
        metadata: {slug: org.slug, name: org.name},
      })

      return org
    }),

  /**
   * Update an organization
   * - For verified orgs: slug/name changes require change request
   * - For non-verified orgs: slug/name changes have 24h cooldown
   * - Other fields can be updated freely
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        slug: slugSchema.optional(),
        name: z.string().min(1).max(100).optional(),
        avatarUrl: z.string().url().optional().nullable(),
        websiteUrl: z.string().url().optional().nullable(),
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

      // Get current org state
      const {data: org} = await supabase
        .from('organizations')
        .select('is_verified, slug, name, last_slug_change, last_name_change')
        .eq('id', input.id)
        .single()

      if (!org) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        })
      }

      const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours
      const now = Date.now()

      // Handle protected fields (slug, name)
      const protectedChanges: Array<{field: string; value: string}> = []
      if (input.slug && input.slug !== org.slug) {
        protectedChanges.push({field: 'slug', value: input.slug})
      }
      if (input.name && input.name !== org.name) {
        protectedChanges.push({field: 'name', value: input.name})
      }

      // If verified, protected fields require change request
      if (org.is_verified && protectedChanges.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'This organization is verified. Slug and name changes require approval. Use changeRequest.create instead.',
        })
      }

      // If not verified, check cooldowns for protected fields
      if (!org.is_verified && protectedChanges.length > 0) {
        for (const change of protectedChanges) {
          const lastChange =
            change.field === 'slug'
              ? org.last_slug_change
              : org.last_name_change
          if (
            lastChange &&
            now - new Date(lastChange).getTime() < COOLDOWN_MS
          ) {
            const hoursLeft = Math.ceil(
              (COOLDOWN_MS - (now - new Date(lastChange).getTime())) /
                (60 * 60 * 1000),
            )
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `You can change ${change.field} again in ${hoursLeft} hours`,
            })
          }
        }
      }

      // Build update object - only update provided fields
      const updates: Record<string, unknown> = {}
      if (input.slug && input.slug !== org.slug) {
        updates.slug = input.slug
        updates.last_slug_change = new Date().toISOString()
      }
      if (input.name && input.name !== org.name) {
        updates.name = input.name
        updates.last_name_change = new Date().toISOString()
      }
      if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl
      if (input.websiteUrl !== undefined) updates.website_url = input.websiteUrl

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nothing to update',
        })
      }

      updates.updated_at = new Date().toISOString()

      const {data: updatedOrg, error} = await supabase
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

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ORGANIZATION_UPDATE,
        organizationId: input.id,
        targetType: 'organization',
        targetId: input.id,
        metadata: {changes: updates},
      })

      return updatedOrg
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

      // Get org info before deletion for audit
      const {data: org} = await supabase
        .from('organizations')
        .select('slug, name')
        .eq('id', input.id)
        .single()

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

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ORGANIZATION_DELETE,
        organizationId: input.id,
        targetType: 'organization',
        targetId: input.id,
        metadata: {slug: org?.slug, name: org?.name},
      })

      return {success: true}
    }),
})
