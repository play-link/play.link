import {data} from 'react-router';
import {trackEvent} from '../lib/analytics.server';
import type {Route} from './+types/api.track';

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    throw data('Method not allowed', {status: 405});
  }

  const env = (context as unknown as {cloudflare: {env: Env}}).cloudflare.env;

  const body = await request.json();
  const {gameId, eventType, linkId} = body as {
    gameId: string;
    eventType: string;
    linkId?: string;
  };

  if (!gameId || !eventType) {
    throw data('Missing required fields', {status: 400});
  }

  if (!['page_view', 'link_click', 'subscribe'].includes(eventType)) {
    throw data('Invalid event type', {status: 400});
  }

  await trackEvent(env, {
    gameId,
    eventType: eventType as 'page_view' | 'link_click' | 'subscribe',
    linkId,
    request,
  });

  return new Response(null, {status: 204});
}
