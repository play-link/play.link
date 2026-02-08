import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, publicProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

// Roles that can update a studio
const UPDATE_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]

// Slug validation: lowercase letters, numbers, hyphens only
const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only',
  )

export const studioRouter = router({
  /**
   * Check if a studio slug is available
   */
  checkSlug: protectedProcedure
    .input(z.object({slug: slugSchema}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data, error} = await supabase
        .from('studios')
        .select('id')
        .eq('slug', input.slug)
        .maybeSingle()

      if (error) {
        return {available: false, error: error.message}
      }

      return {available: data === null}
    }),

  /**
   * List studios for current user
   */
  list: protectedProcedure.query(async ({ctx}) => {
    const {user, supabase} = ctx

    // Get studios where user is a member
    const {data: memberships, error: memberError} = await supabase
      .from('studio_members')
      .select('studio_id, role')
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

    // Get the actual studios
    const studioIds = memberships.map((m) => m.studio_id)
    const {data: studios, error: studiosError} = await supabase
      .from('studios')
      .select('*')
      .in('id', studioIds)

    if (studiosError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: studiosError.message,
      })
    }

    // Add role to each studio
    return (
      studios?.map((studio) => ({
        ...studio,
        role: memberships.find((m) => m.studio_id === studio.id)?.role,
      })) || []
    )
  }),

  /**
   * Create a new studio
   */
  create: protectedProcedure
    .input(z.object({slug: slugSchema, name: z.string().min(1).max(100)}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Create studio
      const {data: studio, error: studioError} = await supabase
        .from('studios')
        .insert({slug: input.slug, name: input.name})
        .select()
        .single()

      if (studioError) {
        if (studioError.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Studio slug already exists',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: studioError.message,
        })
      }

      // Add creator as OWNER
      const {error: memberError} = await supabase
        .from('studio_members')
        .insert({
          studio_id: studio.id,
          user_id: user.id,
          role: StudioRole.OWNER,
        })

      if (memberError) {
        // Rollback: delete the studio if we couldn't add the member
        await supabase.from('studios').delete().eq('id', studio.id)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add owner to studio',
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.STUDIO_CREATE,
        studioId: studio.id,
        targetType: 'studio',
        targetId: studio.id,
        metadata: {slug: studio.slug, name: studio.name},
      })

      return studio
    }),

  /**
   * Update a studio
   * - For verified studios: slug/name changes require change request
   * - For non-verified studios: slug/name changes have 24h cooldown
   * - Other fields can be updated freely
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        slug: slugSchema.optional(),
        name: z.string().min(1).max(100).optional(),
        avatarUrl: z.string().url().optional().nullable(),
        coverUrl: z.string().url().optional().nullable(),
        backgroundColor: z.string().regex(/^#[0-9a-f]{3,8}$/i).optional().nullable(),
        accentColor: z.string().regex(/^#[0-9a-f]{3,8}$/i).optional().nullable(),
        textColor: z.string().regex(/^#[0-9a-f]{3,8}$/i).optional().nullable(),
        bio: z.string().max(280).optional().nullable(),
        socialLinks: z.record(z.string(), z.string().url().or(z.literal(''))).optional().nullable(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is OWNER or ADMIN
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.id)
        .eq('user_id', user.id)
        .single()

      if (!member || !UPDATE_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({code: 'FORBIDDEN'})
      }

      // Get current studio state
      const {data: studio} = await supabase
        .from('studios')
        .select('is_verified, slug, name, last_slug_change')
        .eq('id', input.id)
        .single()

      if (!studio) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Studio not found',
        })
      }

      const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours
      const now = Date.now()

      // Handle protected fields (only slug is protected)
      const isSlugChanging = input.slug && input.slug !== studio.slug

      // If verified, slug changes require change request
      if (studio.is_verified && isSlugChanging) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'This studio is verified. Slug changes require approval. Use changeRequest.create instead.',
        })
      }

      // If not verified, check cooldown for slug changes
      if (!studio.is_verified && isSlugChanging) {
        if (
          studio.last_slug_change &&
          now - new Date(studio.last_slug_change).getTime() < COOLDOWN_MS
        ) {
          const hoursLeft = Math.ceil(
            (COOLDOWN_MS - (now - new Date(studio.last_slug_change).getTime())) /
              (60 * 60 * 1000),
          )
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `You can change slug again in ${hoursLeft} hours`,
          })
        }
      }

      // Build update object - only update provided fields
      const updates: Record<string, unknown> = {}
      if (input.slug && input.slug !== studio.slug) {
        updates.slug = input.slug
        updates.last_slug_change = new Date().toISOString()
      }
      if (input.name !== undefined && input.name !== studio.name) {
        updates.name = input.name
      }
      if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl
      if (input.coverUrl !== undefined) updates.cover_url = input.coverUrl
      if (input.backgroundColor !== undefined) updates.background_color = input.backgroundColor
      if (input.accentColor !== undefined) updates.accent_color = input.accentColor
      if (input.textColor !== undefined) updates.text_color = input.textColor
      if (input.bio !== undefined) updates.bio = input.bio
      if (input.socialLinks !== undefined) updates.social_links = input.socialLinks

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nothing to update',
        })
      }

      updates.updated_at = new Date().toISOString()

      const {data: updatedStudio, error} = await supabase
        .from('studios')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Studio slug already exists',
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
        action: AuditAction.STUDIO_UPDATE,
        studioId: input.id,
        targetType: 'studio',
        targetId: input.id,
        metadata: {changes: updates},
      })

      return updatedStudio
    }),

  /**
   * Delete a studio
   */
  delete: protectedProcedure
    .input(z.object({id: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is OWNER
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.id)
        .eq('user_id', user.id)
        .single()

      if (!member || member.role !== StudioRole.OWNER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the owner can delete a studio',
        })
      }

      // Get studio info before deletion for audit
      const {data: studio} = await supabase
        .from('studios')
        .select('slug, name')
        .eq('id', input.id)
        .single()

      const {error} = await supabase
        .from('studios')
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
        action: AuditAction.STUDIO_DELETE,
        studioId: input.id,
        targetType: 'studio',
        targetId: input.id,
        metadata: {slug: studio?.slug, name: studio?.name},
      })

      return {success: true}
    }),

  /**
   * Public studio profile (no auth required)
   */
  publicProfile: publicProcedure
    .input(z.object({handle: slugSchema}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data: studio, error} = await supabase
        .from('studios')
        .select('id, slug, name, avatar_url, cover_url, background_color, accent_color, text_color, bio, social_links, is_verified')
        .eq('slug', input.handle)
        .single()

      if (error || !studio) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Studio not found'})
      }

      // Fetch published games with their page slugs
      const {data: pages} = await supabase
        .from('game_pages')
        .select('slug, games!inner(id, title, summary, cover_url, status)')
        .eq('games.owner_studio_id', studio.id)
        .eq('visibility', 'PUBLISHED')
        .eq('is_primary', true)

      return {
        name: studio.name,
        handle: studio.slug,
        avatarImage: studio.avatar_url,
        coverImage: studio.cover_url,
        isVerified: studio.is_verified,
        theme: {
          backgroundColor: studio.background_color ?? '#030712',
          accentColor: studio.accent_color ?? '#818cf8',
          textColor: studio.text_color ?? '#ffffff',
        },
        bio: studio.bio,
        socialLinks: (studio.social_links as Record<string, string>) ?? {},
        games: (pages ?? []).map((p: any) => ({
          id: p.games.id,
          title: p.games.title,
          summary: p.games.summary,
          coverUrl: p.games.cover_url,
          status: p.games.status,
          pageSlug: p.slug,
        })),
      }
    }),
})
