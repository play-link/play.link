import {data} from 'react-router';
import {createAdminClient} from '@play/supabase-client/server';
import {verifyUnsubscribeToken} from '../lib/unsubscribe.server';
import type {Route} from './+types/unsubscribe';

export async function loader({request, context}: Route.LoaderArgs) {
  const env = (context as unknown as {cloudflare: {env: Env}}).cloudflare.env;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return data({success: false, error: 'Missing token'}, {status: 400});
  }

  const result = await verifyUnsubscribeToken(
    env.SUPABASE_SERVICE_ROLE_KEY,
    token,
  );

  if (!result) {
    return data({success: false, error: 'Invalid or expired link'}, {status: 400});
  }

  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const {error} = await supabase
    .from('game_subscribers')
    .update({unsubscribed_at: new Date().toISOString()})
    .eq('game_id', result.gameId)
    .eq('email', result.email)
    .is('unsubscribed_at', null);

  if (error) {
    console.error('Failed to unsubscribe:', error.message);
    return data({success: false, error: 'Something went wrong'}, {status: 500});
  }

  return data({success: true, error: null});
}

export default function UnsubscribePage({loaderData}: Route.ComponentProps) {
  const {success, error} = loaderData;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030712',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '1rem',
      }}
    >
      <div style={{maxWidth: '24rem', textAlign: 'center'}}>
        {success ? (
          <>
            <h1 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem'}}>
              Unsubscribed
            </h1>
            <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', lineHeight: 1.5}}>
              You've been successfully unsubscribed and won't receive any more emails from this game.
            </p>
          </>
        ) : (
          <>
            <h1 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem'}}>
              Oops
            </h1>
            <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', lineHeight: 1.5}}>
              {error || 'This unsubscribe link is invalid or has already been used.'}
            </p>
          </>
        )}
        <a
          href="https://play.link"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            color: '#818cf8',
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Go to play.link
        </a>
      </div>
    </div>
  );
}
