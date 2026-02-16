-- Seed data for admin outreach backoffice

INSERT INTO public.admin_outreach_leads (
  id,
  target_type,
  target_slug,
  target_name,
  channel,
  contact_identifier,
  contact_display_name,
  source,
  confidence_score,
  status,
  is_blocked,
  notes,
  last_contacted_at,
  next_action_at,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'game',
    'hollow-knight-silksong',
    'Hollow Knight: Silksong',
    'email',
    'team@teamcherry.com.au',
    'Team Cherry',
    'steam_scan',
    91,
    'contacted',
    false,
    'Initial intro email sent. Waiting for reply.',
    now() - INTERVAL '1 day',
    now() + INTERVAL '2 days',
    now() - INTERVAL '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'game',
    'celeste',
    'Celeste',
    'twitter',
    '@MaddyThorson',
    'Maddy',
    'import',
    88,
    'replied',
    false,
    'Positive reply. Asked for ownership confirmation flow details.',
    now() - INTERVAL '8 hours',
    now() + INTERVAL '1 day',
    now() - INTERVAL '5 days'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'studio',
    'coffee-stain',
    'Coffee Stain Studios',
    'discord',
    'coffeestain#0420',
    'Coffee Stain',
    'manual',
    73,
    'queued',
    false,
    'Queued for Discord outreach this afternoon.',
    NULL,
    now() + INTERVAL '6 hours',
    now() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'game',
    'pac-man',
    'PAC-MAN',
    'email',
    'hello@arcade-example.com',
    'Arcade Team',
    'steam_scan',
    40,
    'blocked',
    true,
    'Bounced repeatedly and marked as blocked.',
    now() - INTERVAL '10 days',
    NULL,
    now() - INTERVAL '14 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_outreach_threads (
  id,
  lead_id,
  channel,
  status,
  external_thread_id,
  last_outbound_at,
  last_inbound_at,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'email',
    'awaiting_reply',
    'msg-thread-101',
    now() - INTERVAL '1 day',
    NULL,
    now() - INTERVAL '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'twitter',
    'replied',
    'dm-7788',
    now() - INTERVAL '14 hours',
    now() - INTERVAL '8 hours',
    now() - INTERVAL '5 days'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000103',
    'discord',
    'open',
    'discord-thread-42',
    NULL,
    NULL,
    now() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_outreach_messages (
  id,
  thread_id,
  lead_id,
  channel,
  direction,
  provider,
  provider_message_id,
  template_id,
  subject,
  body,
  status,
  error_code,
  error_message,
  scheduled_at,
  sent_at,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'email',
    'outbound',
    'resend',
    'res_101_a',
    'intro_v1',
    'We created your play.link page',
    'Hi Team Cherry, we created a page and you can claim ownership...',
    'delivered',
    NULL,
    NULL,
    now() - INTERVAL '25 hours',
    now() - INTERVAL '24 hours',
    now() - INTERVAL '24 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'twitter',
    'outbound',
    'twitter_api',
    'tw_202_a',
    'dm_intro',
    NULL,
    'Hey! We made a play.link page for Celeste...',
    'sent',
    NULL,
    NULL,
    now() - INTERVAL '15 hours',
    now() - INTERVAL '14 hours',
    now() - INTERVAL '14 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'twitter',
    'inbound',
    'twitter_api',
    'tw_202_b',
    NULL,
    NULL,
    'Sounds good, can you share claim steps?',
    NULL,
    NULL,
    NULL,
    NULL,
    now() - INTERVAL '8 hours',
    now() - INTERVAL '8 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000103',
    'discord',
    'outbound',
    'discord_bot',
    'dc_303_a',
    'discord_intro',
    NULL,
    'Hi! We pre-created your play.link page. Want to claim it?',
    'queued',
    NULL,
    NULL,
    now() + INTERVAL '1 hour',
    NULL,
    now() - INTERVAL '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000103',
    'discord',
    'outbound',
    'discord_bot',
    'dc_303_old',
    'discord_intro',
    NULL,
    'Previous attempt',
    'failed',
    'rate_limit',
    'Rate limited by provider',
    now() - INTERVAL '20 hours',
    NULL,
    now() - INTERVAL '20 hours'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_outreach_events (
  id,
  message_id,
  thread_id,
  lead_id,
  provider,
  provider_event_id,
  event_type,
  occurred_at,
  payload_json,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'resend',
    'evt_res_101_delivered',
    'delivered',
    now() - INTERVAL '24 hours',
    '{"provider":"resend","status":"delivered"}'::jsonb,
    now() - INTERVAL '24 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'twitter_api',
    'evt_tw_202_sent',
    'sent',
    now() - INTERVAL '14 hours',
    '{"provider":"twitter_api","status":"sent"}'::jsonb,
    now() - INTERVAL '14 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'twitter_api',
    'evt_tw_202_reply',
    'reply_received',
    now() - INTERVAL '8 hours',
    '{"provider":"twitter_api","status":"received"}'::jsonb,
    now() - INTERVAL '8 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000404',
    '00000000-0000-0000-0000-000000000305',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000103',
    'discord_bot',
    'evt_dc_303_fail',
    'failed',
    now() - INTERVAL '20 hours',
    '{"provider":"discord_bot","error":"rate_limit"}'::jsonb,
    now() - INTERVAL '20 hours'
  )
ON CONFLICT (id) DO NOTHING;
