import {data} from 'react-router';
import {createAdminClient} from '@play/supabase-client/server';
import type {Tables} from '@play/supabase-client';
import {trackEvent} from '../lib/analytics.server';
import {getGamePageBySlug} from '../lib/game.server';
import type {Route} from './+types/game';

type GameLink = Tables<'game_links'>;

interface CloudflareLoadContext {
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
}

export async function loader({params, context, request}: Route.LoaderArgs) {
  const cf = context as unknown as CloudflareLoadContext;
  const env = cf.cloudflare.env;

  const slug = params.gameSlug;
  if (!slug) {
    throw data('Not Found', {status: 404});
  }

  const result = await getGamePageBySlug(env, slug);
  if (!result) {
    throw data('Game not found', {status: 404});
  }

  const {page, game} = result;

  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const {data: links} = await supabase
    .from('game_links')
    .select('*')
    .eq('game_id', game.id)
    .order('position', {ascending: true});

  // Track page view (fire-and-forget, don't block response)
  cf.cloudflare.ctx.waitUntil(
    trackEvent(env, {
      gameId: game.id,
      eventType: 'page_view',
      request,
    }),
  );

  return data(
    {game, page, links: (links || []) as GameLink[]},
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    },
  );
}

export function meta({data: loaderData}: Route.MetaArgs) {
  if (!loaderData) {
    return [{title: 'Game Not Found - Play.link'}];
  }

  const {game, page} = loaderData;

  const tags: ReturnType<typeof Array<Record<string, string>>> = [
    {title: `${game.title} - Play.link`},
    {
      name: 'description',
      content: game.summary || `${game.title} on Play.link`,
    },
    {property: 'og:title', content: game.title},
    {property: 'og:description', content: game.summary || ''},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: `https://play.link/${page.slug}`},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: game.title},
    {name: 'twitter:description', content: game.summary || ''},
  ];

  if (game.cover_url) {
    tags.push({property: 'og:image', content: game.cover_url});
    tags.push({name: 'twitter:image', content: game.cover_url});
  }

  if (game.theme_color) {
    tags.push({name: 'theme-color', content: game.theme_color});
  }

  return tags;
}

const LINK_ICONS: Record<string, string> = {
  steam: '🎮',
  itch: '🕹️',
  epic: '🎯',
  discord: '💬',
  youtube: '▶️',
  website: '🌐',
  demo: '🎲',
};

function trackLinkClick(gameId: string, linkId: string) {
  navigator.sendBeacon(
    '/api/track',
    JSON.stringify({gameId, eventType: 'link_click', linkId}),
  );
}

export default function GamePage({loaderData}: Route.ComponentProps) {
  const {game, page, links} = loaderData;

  // Theme colors from page_config, with fallbacks
  const theme = (page.page_config as Record<string, unknown> | null)?.theme as
    | Record<string, string>
    | undefined;
  const bgColor = theme?.bgColor || '#030712';
  const textColor = theme?.textColor || '#ffffff';
  const linkColor = theme?.linkColor || '#818cf8';

  return (
    <div className="min-h-screen" style={{background: bgColor, color: textColor}}>
      {game.header_url && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={game.header_url}
            alt={`${game.title} header`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">
          {game.cover_url && (
            <img
              src={game.cover_url}
              alt={game.title}
              className="w-48 rounded-lg shadow-lg shrink-0"
              style={{aspectRatio: '16 / 9', objectFit: 'cover'}}
            />
          )}
          <div className="flex-1 pt-2">
            <h1 className="text-4xl font-bold">{game.title}</h1>
            {game.summary && (
              <p className="mt-2 text-lg" style={{color: textColor, opacity: 0.75}}>
                {game.summary}
              </p>
            )}
            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {game.genres.map((genre: string) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      background: `color-mix(in srgb, ${textColor} 15%, transparent)`,
                      color: textColor,
                      opacity: 0.8,
                    }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {links.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Links</h2>
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLinkClick(game.id, link.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-opacity hover:opacity-80"
                  style={{
                    background: `color-mix(in srgb, ${textColor} 5%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${textColor} 15%, transparent)`,
                  }}
                >
                  <span className="text-lg">
                    {LINK_ICONS[link.type] || '🔗'}
                  </span>
                  <span className="font-medium" style={{color: linkColor}}>
                    {link.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {game.trailer_url && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Trailer</h2>
            <a
              href={game.trailer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{color: linkColor}}
            >
              Watch trailer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
