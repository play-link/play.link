import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

const CLAIM_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]

const slugSchema = z
  .string()
  .min(3)
  .max(150)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only',
  )

export const ownershipClaimRouter = router({
  claimOwnership: protectedProcedure
    .input(
      z.object({
        pageSlug: slugSchema,
        targetStudioId: z.string().uuid(),
        details: z.string().max(2000).optional().nullable(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: membership} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.targetStudioId)
        .eq('user_id', user.id)
        .single()

      if (!membership || !CLAIM_ROLES.includes(membership.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission in the target studio',
        })
      }

      const {data: page} = await supabase
        .from('game_pages')
        .select('id, slug, game_id, is_claimable, game:games(owner_studio_id, title)')
        .eq('slug', input.pageSlug)
        .single()

      if (!page) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game page not found',
        })
      }

      const pageGame = page.game as {owner_studio_id?: string; title?: string} | null
      const currentStudioId = pageGame?.owner_studio_id || null

      if (!currentStudioId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Game owner studio is missing',
        })
      }

      if (!page.is_claimable) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Ownership claims are not enabled for this game page',
        })
      }

      if (currentStudioId === input.targetStudioId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This game already belongs to your studio',
        })
      }

      const {data: existingClaim} = await supabase
        .from('ownership_claims')
        .select('id')
        .eq('page_id', page.id)
        .eq('requested_studio_id', input.targetStudioId)
        .eq('status', 'open')
        .maybeSingle()

      if (existingClaim) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'There is already an active ownership claim for this studio and slug',
        })
      }

      const now = new Date().toISOString()

      const {data: createdClaim, error: claimError} = await supabase
        .from('ownership_claims')
        .insert({
          page_id: page.id,
          game_id: page.game_id,
          current_studio_id: currentStudioId,
          requested_studio_id: input.targetStudioId,
          claimed_slug: page.slug,
          claimant_user_id: user.id,
          claimant_email: user.email,
          details: input.details || null,
          status: 'open',
          updated_at: now,
        })
        .select('*')
        .single()

      if (claimError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: claimError.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.OWNERSHIP_CLAIM_CREATE,
        studioId: input.targetStudioId,
        targetType: 'ownership_claim',
        targetId: createdClaim.id,
        metadata: {
          pageId: page.id,
          pageSlug: page.slug,
          gameId: page.game_id,
          currentStudioId,
          requestedStudioId: input.targetStudioId,
          gameTitle: pageGame?.title || null,
        },
      })

      return createdClaim
    }),

  myClaims: protectedProcedure
    .input(
      z.object({
        status: z.enum(['open', 'approved', 'rejected']).optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

      let query = supabase
        .from('ownership_claims')
        .select('*')
        .eq('claimant_user_id', user.id)
        .order('created_at', {ascending: false})

      if (input.status) {
        query = query.eq('status', input.status)
      }

      const {data, error} = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),
})
