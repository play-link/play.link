import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

const EDIT_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MEMBER]

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
    .select('id, game_id, slug, visibility, page_config')
    .eq('id', pageId)
    .single()

  if (!page) {
    throw new TRPCError({code: 'NOT_FOUND', message: 'Game page not found'})
  }

  const {data: game} = await supabase
    .from('games')
    .select('owner_studio_id')
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

  return {page, game}
}

export const gamePageRouter = router({
  checkSlug: protectedProcedure
    .input(z.object({slug: slugSchema}))
    .query(async ({ctx, input}) => {
      const {data} = await ctx.supabase
        .from('game_pages')
        .select('id')
        .eq('slug', input.slug)
        .maybeSingle()

      return {available: data === null}
    }),

  publish: protectedProcedure
    .input(z.object({pageId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {page, game} = await verifyPageAccess(supabase, user.id, input.pageId)

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
        metadata: {action: 'publish', slug: page.slug},
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

      const {data: updated, error} = await supabase
        .from('game_pages')
        .update({
          slug: input.slug,
          last_slug_change: new Date().toISOString(),
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
        metadata: {oldSlug: page.slug, newSlug: input.slug},
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
        metadata: {action: 'update_page_config', slug: page.slug},
      })

      return updated
    }),
})
