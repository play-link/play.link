import {data} from 'react-router';
import {createAdminClient} from '@play/supabase-client/server';
import {trackEvent} from '../lib/analytics.server';
import type {Route} from './+types/api.subscribe';

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    throw data('Method not allowed', {status: 405});
  }

  const env = (context as unknown as {cloudflare: {env: Env}}).cloudflare.env;

  const body = await request.json();
  const {gameId, email} = body as {gameId: string; email: string};

  if (!gameId || !email) {
    throw data('Missing required fields', {status: 400});
  }

  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw data('Invalid email', {status: 400});
  }

  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const {error} = await supabase
    .from('game_subscribers')
    .upsert(
      {game_id: gameId, email},
      {onConflict: 'game_id,email'},
    );

  if (error) {
    console.error('Failed to subscribe:', error.message);
    throw data('Failed to subscribe', {status: 500});
  }

  await trackEvent(env, {
    gameId,
    eventType: 'subscribe',
    request,
  });

  return data({ok: true}, {status: 200});
}
