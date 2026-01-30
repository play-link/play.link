import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {OrgRoleType} from '@play/supabase-client'
import {OrgRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

const EDIT_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER]

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
    .select('id, game_id, slug, visibility')
    .eq('id', pageId)
    .single()

  if (!page) {
    throw new TRPCError({code: 'NOT_FOUND', message: 'Game page not found'})
  }

  const {data: game} = await supabase
    .from('games')
    .select('owner_organization_id')
    .eq('id', page.game_id)
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
        organizationId: game.owner_organization_id,
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
        organizationId: game.owner_organization_id,
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
        organizationId: game.owner_organization_id,
        targetType: 'game_page',
        targetId: input.pageId,
        metadata: {oldSlug: page.slug, newSlug: input.slug},
      })

      return updated
    }),

  updatePageConfig: protectedProcedure
    .input(z.object({
      pageId: z.string().uuid(),
      pageConfig: z.any(),
    }))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {page, game} = await verifyPageAccess(supabase, user.id, input.pageId)

      const {data: updated, error} = await supabase
        .from('game_pages')
        .update({
          page_config: input.pageConfig,
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
        organizationId: game.owner_organization_id,
        targetType: 'game_page',
        targetId: input.pageId,
        metadata: {action: 'update_page_config', slug: page.slug},
      })

      return updated
    }),
})
