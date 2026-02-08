import {Resend} from 'resend'
import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {StudioRole} from '@play/supabase-client'
import type {StudioRoleType} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {verifyGameAccess} from '../lib/verify-access'

const EDIT_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]

async function generateUnsubscribeToken(secret: string, gameId: string, email: string): Promise<string> {
  const payload = `${gameId}:${email}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const data = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${data}.${hex}`
}

export const gameUpdateRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {data, error} = await supabase
        .from('game_updates')
        .select('*')
        .eq('game_id', input.gameId)
        .order('created_at', {ascending: false})
        .range(input.offset, input.offset + input.limit - 1)

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      return data || []
    }),

  get: protectedProcedure
    .input(z.object({id: z.string().uuid(), gameId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {data, error} = await supabase
        .from('game_updates')
        .select('*')
        .eq('id', input.id)
        .eq('game_id', input.gameId)
        .single()

      if (error || !data) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Update not found'})
      }

      return data
    }),

  create: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(10000),
        ctaUrl: z.string().url().optional(),
        ctaLabel: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

      const {data, error} = await supabase
        .from('game_updates')
        .insert({
          game_id: input.gameId,
          title: input.title,
          body: input.body,
          cta_url: input.ctaUrl || null,
          cta_label: input.ctaLabel || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      return data
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        gameId: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        body: z.string().min(1).max(10000).optional(),
        ctaUrl: z.string().url().nullable().optional(),
        ctaLabel: z.string().max(100).nullable().optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

      // Can only edit drafts
      const {data: existing} = await supabase
        .from('game_updates')
        .select('status')
        .eq('id', input.id)
        .eq('game_id', input.gameId)
        .single()

      if (!existing) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Update not found'})
      }
      if (existing.status === 'published') {
        throw new TRPCError({code: 'BAD_REQUEST', message: 'Cannot edit a published update'})
      }

      const updates: Record<string, unknown> = {updated_at: new Date().toISOString()}
      if (input.title !== undefined) updates.title = input.title
      if (input.body !== undefined) updates.body = input.body
      if (input.ctaUrl !== undefined) updates.cta_url = input.ctaUrl
      if (input.ctaLabel !== undefined) updates.cta_label = input.ctaLabel

      const {data, error} = await supabase
        .from('game_updates')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      return data
    }),

  publish: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        gameId: z.string().uuid(),
        sendEmail: z.boolean().default(false),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase, env} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

      const {data: update} = await supabase
        .from('game_updates')
        .select('*')
        .eq('id', input.id)
        .eq('game_id', input.gameId)
        .single()

      if (!update) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Update not found'})
      }
      if (update.status === 'published') {
        throw new TRPCError({code: 'BAD_REQUEST', message: 'Update already published'})
      }

      // Get game info for email
      const {data: game} = await supabase
        .from('games')
        .select('title, pages:game_pages(slug)')
        .eq('id', input.gameId)
        .single()

      const now = new Date().toISOString()
      let sentCount = 0

      // Send emails if requested
      if (input.sendEmail) {
        if (!env.RESEND_API_KEY) {
          console.warn('[gameUpdate.publish] RESEND_API_KEY not set, skipping email')
        } else {
          const {data: subscribers, error: subError} = await supabase
            .from('game_subscribers')
            .select('email')
            .eq('game_id', input.gameId)
            .eq('confirmed', true)
            .is('unsubscribed_at', null)

          console.log(`[gameUpdate.publish] Found ${subscribers?.length ?? 0} confirmed subscribers`, subError ? `error: ${subError.message}` : '')

          if (subscribers && subscribers.length > 0) {
            const resend = new Resend(env.RESEND_API_KEY)
            const gameTitle = game?.title || 'Game'
            const gameSlug = (game as any)?.pages?.[0]?.slug || ''
            const ctaHtml = update.cta_url
              ? `<p style="margin-top:24px"><a href="${update.cta_url}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">${update.cta_label || 'Learn more'}</a></p>`
              : ''

            // Generate unsubscribe tokens for each subscriber
            const hmacSecret = env.SUPABASE_SERVICE_ROLE_KEY
            const tokenMap = new Map<string, string>()
            for (const sub of subscribers) {
              tokenMap.set(sub.email, await generateUnsubscribeToken(hmacSecret, input.gameId, sub.email))
            }

            // Send in batches of 50
            const batchSize = 50
            for (let i = 0; i < subscribers.length; i += batchSize) {
              const batch = subscribers.slice(i, i + batchSize)
              try {
                const result = await resend.batch.send(
                  batch.map((sub: {email: string}) => {
                    const unsubUrl = `https://play.link/unsubscribe?token=${tokenMap.get(sub.email)}`
                    return {
                      from: `${gameTitle} <updates@updates.play.link>`,
                      to: [sub.email],
                      subject: update.title,
                      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
                        <h1 style="font-size:24px;margin-bottom:8px">${update.title}</h1>
                        <p style="color:#666;font-size:14px;margin-bottom:24px">from ${gameTitle}</p>
                        <div style="font-size:16px;line-height:1.6;white-space:pre-wrap">${update.body}</div>
                        ${ctaHtml}
                        <hr style="border:none;border-top:1px solid #eee;margin:32px 0" />
                        <p style="font-size:12px;color:#999">You received this because you subscribed to ${gameTitle} on <a href="https://play.link/${gameSlug}">play.link</a>. <a href="${unsubUrl}" style="color:#999">Unsubscribe</a></p>
                      </div>`,
                    }
                  }),
                )
                console.log(`[gameUpdate.publish] Resend batch result:`, JSON.stringify(result))
                sentCount += batch.length
              } catch (e) {
                console.error('[gameUpdate.publish] Failed to send email batch:', e)
              }
            }
          }
        }
      }

      // Update status
      const {data: published, error} = await supabase
        .from('game_updates')
        .update({
          status: 'published',
          published_at: now,
          published_by: user.id,
          sent_count: sentCount,
          sent_at: sentCount > 0 ? now : null,
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      return published
    }),

  delete: protectedProcedure
    .input(z.object({id: z.string().uuid(), gameId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

      const {error} = await supabase
        .from('game_updates')
        .delete()
        .eq('id', input.id)
        .eq('game_id', input.gameId)

      if (error) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
      }

      return {success: true}
    }),
})
