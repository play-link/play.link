import {createAdminClient} from '@play/supabase-client/server'
import type {SupabaseClient} from '@supabase/supabase-js'
import {Resend} from 'resend'
import type {Env} from '../types'

const DEFAULT_BATCH_SIZE = 20
const MAX_BATCH_SIZE = 100
const SUPPORTED_CHANNELS = ['email', 'twitter'] as const

type OutreachLeadRelation = {
  id: string
  channel: 'email' | 'discord' | 'twitter'
  contact_identifier: string
  contact_display_name: string | null
  target_name: string
  status:
    | 'new'
    | 'queued'
    | 'contacted'
    | 'replied'
    | 'interested'
    | 'not_interested'
    | 'bounced'
    | 'blocked'
    | 'claimed'
  is_blocked: boolean
}

type QueuedOutreachMessage = {
  id: string
  thread_id: string
  lead_id: string
  channel: 'email' | 'discord' | 'twitter'
  provider: string
  subject: string | null
  body: string | null
  scheduled_at: string | null
  created_at: string
  lead: OutreachLeadRelation | OutreachLeadRelation[] | null
}

type DispatchResult = {
  provider: string
  providerMessageId: string | null
  payload: Record<string, unknown>
}

export type OutreachDispatchSummary = {
  queuedCandidates: number
  dueMessages: number
  processed: number
  delivered: number
  failed: number
  skipped: number
}

function toSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value ?? null
}

function parseBatchSize(rawValue?: string): number {
  if (!rawValue) return DEFAULT_BATCH_SIZE
  const parsed = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BATCH_SIZE
  return Math.min(parsed, MAX_BATCH_SIZE)
}

function isDue(scheduledAt: string | null, nowMs: number): boolean {
  if (!scheduledAt) return true
  const dueMs = new Date(scheduledAt).getTime()
  if (!Number.isFinite(dueMs)) return true
  return dueMs <= nowMs
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}

function normalizeXHandle(value: string): string {
  return value.trim().replace(/^@+/, '')
}

async function insertOutreachEvent(
  supabase: SupabaseClient,
  input: {
    messageId: string
    threadId: string
    leadId: string
    provider: string
    eventType: string
    payload: Record<string, unknown>
    occurredAt: string
  },
) {
  const {error} = await supabase
    .from('admin_outreach_events')
    .insert({
      message_id: input.messageId,
      thread_id: input.threadId,
      lead_id: input.leadId,
      provider: input.provider,
      event_type: input.eventType,
      payload_json: input.payload,
      occurred_at: input.occurredAt,
      created_at: input.occurredAt,
    })

  if (error) {
    console.warn(
      `[outreach-dispatcher] failed to insert event (${input.eventType}) for ${input.messageId}: ${error.message}`,
    )
  }
}

async function sendEmailOutreach(
  env: Env,
  message: QueuedOutreachMessage,
  lead: OutreachLeadRelation,
): Promise<DispatchResult> {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is missing')
  }

  const to = lead.contact_identifier.trim()
  if (!to) {
    throw new Error('Lead is missing contact_identifier')
  }

  const subject = message.subject?.trim() || `Play.link outreach for ${lead.target_name}`
  const text = message.body?.trim()
  if (!text) {
    throw new Error('Message body is empty')
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const response = await resend.emails.send({
    from: env.OUTREACH_EMAIL_FROM || 'Play.link <outreach@play.link>',
    to: [to],
    subject,
    text,
  })

  const resendError = (response as {error?: {message?: string}}).error
  if (resendError) {
    throw new Error(resendError.message || 'Resend send failed')
  }

  const providerMessageId = (
    response as {data?: {id?: string}; id?: string}
  ).data?.id || (response as {id?: string}).id || null

  return {
    provider: 'resend',
    providerMessageId,
    payload: {
      channel: 'email',
      to,
      subject,
    },
  }
}

async function sendXOutreach(
  env: Env,
  message: QueuedOutreachMessage,
  lead: OutreachLeadRelation,
): Promise<DispatchResult> {
  if (!env.X_API_KEY) {
    throw new Error('X_API_KEY is missing')
  }

  const bodyText = message.body?.trim()
  if (!bodyText) {
    throw new Error('Message body is empty')
  }

  const handle = normalizeXHandle(lead.contact_identifier)
  const composedText = handle ? `@${handle} ${bodyText}` : bodyText
  const text = composedText.length > 280 ? `${composedText.slice(0, 277)}...` : composedText
  const apiBaseUrl = env.X_API_BASE_URL || 'https://api.x.com'

  const response = await fetch(`${apiBaseUrl}/2/tweets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.X_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({text}),
  })

  const responseText = await response.text()
  let parsedResponse: unknown = null
  try {
    parsedResponse = responseText ? JSON.parse(responseText) : null
  } catch {
    parsedResponse = responseText
  }

  if (!response.ok) {
    throw new Error(`X API ${response.status}: ${responseText.slice(0, 400)}`)
  }

  const providerMessageId = (
    parsedResponse as {data?: {id?: string}} | null
  )?.data?.id || null

  return {
    provider: 'x',
    providerMessageId,
    payload: {
      channel: 'twitter',
      handle,
      text,
      response: parsedResponse,
    },
  }
}

async function dispatchQueuedMessage(
  env: Env,
  supabase: SupabaseClient,
  message: QueuedOutreachMessage,
  nowIso: string,
): Promise<
    | {status: 'delivered'}
    | {status: 'failed'; error: string}
    | {status: 'skipped'; reason?: string}
  > {
  const lead = toSingleRelation(message.lead)
  if (!lead) {
    return {
      status: 'failed',
      error: 'Lead relation missing',
    }
  }

  if (lead.is_blocked) {
    return {
      status: 'failed',
      error: 'Lead is blocked',
    }
  }

  if (message.channel === 'email' && !env.RESEND_API_KEY) {
    return {
      status: 'skipped',
      reason: 'RESEND_API_KEY is missing',
    }
  }

  if (message.channel === 'twitter' && !env.X_API_KEY) {
    return {
      status: 'skipped',
      reason: 'X_API_KEY is missing',
    }
  }

  const {data: claimed, error: claimError} = await supabase
    .from('admin_outreach_messages')
    .update({
      status: 'sent',
      sent_at: nowIso,
      error_code: null,
      error_message: null,
      updated_at: nowIso,
    })
    .eq('id', message.id)
    .eq('status', 'queued')
    .select('id')
    .maybeSingle()

  if (claimError) {
    return {
      status: 'failed',
      error: `Failed to claim queued message: ${claimError.message}`,
    }
  }
  if (!claimed) {
    return {status: 'skipped'}
  }

  try {
    let dispatchResult: DispatchResult
    if (message.channel === 'email') {
      dispatchResult = await sendEmailOutreach(env, message, lead)
    } else if (message.channel === 'twitter') {
      dispatchResult = await sendXOutreach(env, message, lead)
    } else {
      throw new Error(`Unsupported channel for cron dispatcher: ${message.channel}`)
    }

    const {error: messageUpdateError} = await supabase
      .from('admin_outreach_messages')
      .update({
        status: 'delivered',
        provider: dispatchResult.provider,
        provider_message_id: dispatchResult.providerMessageId,
        error_code: null,
        error_message: null,
        updated_at: nowIso,
      })
      .eq('id', message.id)

    if (messageUpdateError) {
      throw new Error(`Failed to mark message delivered: ${messageUpdateError.message}`)
    }

    const {error: threadError} = await supabase
      .from('admin_outreach_threads')
      .update({
        status: 'awaiting_reply',
        last_outbound_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', message.thread_id)

    if (threadError) {
      console.warn(
        `[outreach-dispatcher] failed to update thread ${message.thread_id}: ${threadError.message}`,
      )
    }

    const nextLeadStatus = lead.status === 'new' || lead.status === 'queued'
      ? 'contacted'
      : lead.status

    const {error: leadError} = await supabase
      .from('admin_outreach_leads')
      .update({
        status: nextLeadStatus,
        last_contacted_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', lead.id)

    if (leadError) {
      console.warn(`[outreach-dispatcher] failed to update lead ${lead.id}: ${leadError.message}`)
    }

    await insertOutreachEvent(supabase, {
      messageId: message.id,
      threadId: message.thread_id,
      leadId: message.lead_id,
      provider: dispatchResult.provider,
      eventType: 'dispatch_delivered',
      payload: dispatchResult.payload,
      occurredAt: nowIso,
    })

    return {status: 'delivered'}
  } catch (error) {
    const errorMessage = toErrorMessage(error).slice(0, 1000)

    const {error: failUpdateError} = await supabase
      .from('admin_outreach_messages')
      .update({
        status: 'failed',
        sent_at: null,
        error_code: 'dispatch_failed',
        error_message: errorMessage,
        updated_at: nowIso,
      })
      .eq('id', message.id)

    if (failUpdateError) {
      console.warn(
        `[outreach-dispatcher] failed to mark message ${message.id} as failed: ${failUpdateError.message}`,
      )
    }

    await insertOutreachEvent(supabase, {
      messageId: message.id,
      threadId: message.thread_id,
      leadId: message.lead_id,
      provider: message.provider || message.channel,
      eventType: 'dispatch_failed',
      payload: {
        channel: message.channel,
        error: errorMessage,
      },
      occurredAt: nowIso,
    })

    return {
      status: 'failed',
      error: errorMessage,
    }
  }
}

export async function runOutreachDispatcher(env: Env): Promise<OutreachDispatchSummary> {
  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  ) as unknown as SupabaseClient
  const now = new Date()
  const nowIso = now.toISOString()
  const nowMs = now.getTime()
  const batchSize = parseBatchSize(env.OUTREACH_DISPATCH_BATCH_SIZE)
  const queryLimit = Math.max(batchSize * 3, batchSize)

  const {data, error} = await supabase
    .from('admin_outreach_messages')
    .select(`
      id,
      thread_id,
      lead_id,
      channel,
      provider,
      subject,
      body,
      scheduled_at,
      created_at,
      lead:admin_outreach_leads!admin_outreach_messages_lead_id_fkey(
        id,
        channel,
        contact_identifier,
        contact_display_name,
        target_name,
        status,
        is_blocked
      )
    `)
    .eq('direction', 'outbound')
    .eq('status', 'queued')
    .in('channel', [...SUPPORTED_CHANNELS])
    .order('scheduled_at', {ascending: true, nullsFirst: true})
    .order('created_at', {ascending: true})
    .limit(queryLimit)

  if (error) {
    throw new Error(`Failed to load queued outreach messages: ${error.message}`)
  }

  const queuedCandidates = (data as QueuedOutreachMessage[] | null) || []
  const dueMessages = queuedCandidates.filter(message => isDue(message.scheduled_at, nowMs)).slice(0, batchSize)

  const summary: OutreachDispatchSummary = {
    queuedCandidates: queuedCandidates.length,
    dueMessages: dueMessages.length,
    processed: 0,
    delivered: 0,
    failed: 0,
    skipped: 0,
  }

  for (const message of dueMessages) {
    summary.processed += 1
    const result = await dispatchQueuedMessage(env, supabase, message, nowIso)
    if (result.status === 'delivered') {
      summary.delivered += 1
    } else if (result.status === 'failed') {
      summary.failed += 1
      console.warn(
        `[outreach-dispatcher] message ${message.id} failed (${message.channel}): ${result.error}`,
      )
    } else {
      summary.skipped += 1
      if (result.reason) {
        console.log(`[outreach-dispatcher] skipped ${message.id}: ${result.reason}`)
      }
    }
  }

  return summary
}
