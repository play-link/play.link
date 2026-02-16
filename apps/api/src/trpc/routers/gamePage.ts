import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'
import {isSlugProtected} from '../lib/protected-slugs'

const EDIT_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]

const slugSchema = z
  .string()
  .min(3)
  .max(150)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only',
  )

async function verifyPageAccess(supabase: any, userId: string, pageId: string) {
  const {data: page} = await supabase
    .from('game_pages')
    .select('id, game_id, slug, requested_slug, visibility, page_config')
    .eq('id', pageId)
    .single()

  if (!page) {
    throw new TRPCError({code: 'NOT_FOUND', message: 'Game page not found'})
  }

  const {data: game} = await supabase
    .from('games')
    .select('owner_studio_id, is_verified')
    .eq('id', page.game_id)
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
    throw new TRPCError({code: 'FORBIDDEN', message: 'No access to this game page'})
  }

  return {
    page,
    game,
  }
}

export const gamePageRouter = router({
  checkSlug: protectedProcedure
    .input(z.object({slug: slugSchema}))
    .query(async ({ctx, input}) => {
      const slugProtected = await isSlugProtected(ctx.supabase, 'game_page', input.slug)

      const {data} = await ctx.supabase
        .from('game_pages')
        .select('id')
        .eq('slug', input.slug)
        .maybeSingle()

      return {available: data === null, requiresVerification: slugProtected}
    }),

  publish: protectedProcedure
    .input(z.object({pageId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {page, game} = await verifyPageAccess(supabase, user.id, input.pageId)
      const effectiveSlug = page.requested_slug || page.slug
      const slugProtected = await isSlugProtected(supabase, 'game_page', effectiveSlug)

      if (slugProtected && !game.is_verified) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This protected slug requires admin verification before publishing.',
        })
      }

      const {data: updated, error} = await supabase
        .from('game_pages')
        .update({
          visibility: 'PUBLISHED',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.pageId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_UPDATE,
        studioId: game.owner_studio_id,
        targetType: 'game_page',
        targetId: input.pageId,
        metadata: {action: 'publish', slug: page.slug, requestedSlug: page.requested_slug || null},
      })

      return updated
    }),

  unpublish: protectedProcedure
    .input(z.object({pageId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {page, game} = await verifyPageAccess(supabase, user.id, input.pageId)

      const {data: updated, error} = await supabase
        .from('game_pages')
        .update({
          visibility: 'DRAFT',
          unpublished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.pageId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_UPDATE,
        studioId: game.owner_studio_id,
        targetType: 'game_page',
        targetId: input.pageId,
        metadata: {action: 'unpublish', slug: page.slug},
      })

      return updated
    }),

  updateSlug: protectedProcedure
    .input(z.object({
      pageId: z.string().uuid(),
      slug: slugSchema,
    }))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {page, game} = await verifyPageAccess(supabase, user.id, input.pageId)
      const slugProtected = await isSlugProtected(supabase, 'game_page', input.slug)
      const now = new Date().toISOString()

      // Check availability
      const {data: existing} = await supabase
        .from('game_pages')
        .select('id')
        .eq('slug', input.slug)
        .neq('id', input.pageId)
        .maybeSingle()

      if (existing) {
        throw new TRPCError({code: 'CONFLICT', message: 'Slug already taken'})
      }

      const updates: Record<string, unknown> = {
        last_slug_change: now,
        updated_at: now,
      }

      if (slugProtected) {
        updates.slug = `pending-game-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
        updates.requested_slug = input.slug
      } else {
        updates.slug = input.slug
        updates.requested_slug = null
      }

      const {data: updated, error} = await supabase
        .from('game_pages')
        .update(updates)
        .eq('id', input.pageId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      if (slugProtected) {
        const {error: gameUpdateError} = await supabase
          .from('games')
          .update({
            is_verified: false,
            updated_at: now,
          })
          .eq('id', page.game_id)

        if (gameUpdateError) {
          throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: gameUpdateError.message})
        }

        const {error: unpublishError} = await supabase
          .from('game_pages')
          .update({
            visibility: 'DRAFT',
            unpublished_at: now,
            updated_at: now,
          })
          .eq('game_id', page.game_id)
          .eq('visibility', 'PUBLISHED')

        if (unpublishError) {
          throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: unpublishError.message})
        }
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_UPDATE,
        studioId: game.owner_studio_id,
        targetType: 'game_page',
        targetId: input.pageId,
        metadata: {
          oldSlug: page.slug,
          newSlug: input.slug,
          oldRequestedSlug: page.requested_slug || null,
          newRequestedSlug: slugProtected ? input.slug : null,
          requiresVerification: slugProtected,
        },
      })

      return updated
    }),

  updatePageConfig: protectedProcedure
    .input(z.object({
      pageId: z.string().uuid(),
      pageConfig: z.object({
        theme: z
          .object({
            bgColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
            textColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
            linkColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
            secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
            buttonStyle: z.enum(['glass', 'solid', 'outline']).optional(),
            buttonRadius: z.enum(['sm', 'md', 'lg', 'full']).optional(),
            fontFamily: z.string().max(50).optional(),
          })
          .optional(),
        redirectUrl: z.string().url().nullish(),
      }),
    }))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {page, game} = await verifyPageAccess(supabase, user.id, input.pageId)

      const existingConfig = (page.page_config && typeof page.page_config === 'object' && !Array.isArray(page.page_config))
        ? page.page_config as Record<string, unknown>
        : {}

      const mergedConfig = {...existingConfig, ...input.pageConfig}

      const {data: updated, error} = await supabase
        .from('game_pages')
        .update({
          page_config: mergedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.pageId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_UPDATE,
        studioId: game.owner_studio_id,
        targetType: 'game_page',
        targetId: input.pageId,
        metadata: {action: 'update_page_config', slug: page.slug, requestedSlug: page.requested_slug || null},
      })

      return updated
    }),
})
