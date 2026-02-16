import {data} from 'react-router'
import {createAdminClient} from '@play/supabase-client/server'
import type {Route} from './+types/api.report'

const ALLOWED_REPORT_TYPES = [
  'impersonation',
  'trademark',
  'fraud',
  'abuse',
  'other',
] as const

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    throw data('Method not allowed', {status: 405})
  }

  const env = (context as unknown as {cloudflare: {env: Env}}).cloudflare.env

  const body = await request.json()
  const {
    pageId,
    reportType,
    details,
    reporterEmail,
  } = body as {
    pageId?: string
    reportType?: string
    details?: string
    reporterEmail?: string
  }

  if (!pageId || !reportType) {
    throw data('Missing required fields', {status: 400})
  }

  if (!ALLOWED_REPORT_TYPES.includes(reportType as (typeof ALLOWED_REPORT_TYPES)[number])) {
    throw data('Invalid report type', {status: 400})
  }

  const normalizedDetails = (details || '').trim()
  if (normalizedDetails.length > 2000) {
    throw data('Details are too long', {status: 400})
  }

  const normalizedEmail = (reporterEmail || '').trim().toLowerCase()
  if (normalizedEmail) {
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      throw data('Invalid email', {status: 400})
    }
  }

  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const {data: page, error: pageError} = await supabase
    .from('game_pages')
    .select('id, slug, game_id, game:games(owner_studio_id)')
    .eq('id', pageId)
    .single()

  if (pageError || !page) {
    throw data('Game page not found', {status: 404})
  }

  const sourceIp = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || null

  const userAgent = request.headers.get('user-agent') || null
  const pageGame = page.game as {owner_studio_id?: string} | null

  const {error: insertError} = await (supabase as any)
    .from('verification_claims')
    .insert({
      target_type: 'game_page',
      target_id: page.id,
      page_id: page.id,
      game_id: page.game_id,
      studio_id: pageGame?.owner_studio_id || null,
      slug_snapshot: page.slug,
      report_type: reportType,
      details: normalizedDetails || null,
      reporter_email: normalizedEmail || null,
      source_ip: sourceIp,
      user_agent: userAgent,
      status: 'open',
      updated_at: new Date().toISOString(),
    })

  if (insertError) {
    console.error('Failed to create verification claim:', insertError.message)
    throw data('Failed to submit report', {status: 500})
  }

  return data({ok: true}, {status: 200})
}
