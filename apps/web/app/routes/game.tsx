import {useCallback, useEffect, useState} from 'react';
import {data} from 'react-router';
import {createAdminClient} from '@play/supabase-client/server';
import type {Tables} from '@play/supabase-client';
import {trackEvent} from '../lib/analytics.server';
import {trackCampaignClick} from '../lib/campaign.server';
import {getGamePageBySlug} from '../lib/game.server';
import type {Route} from './+types/game';

type GameLink = Tables<'game_links'>;
type GameMedia = Tables<'game_media'>;

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

  const [{data: links}, {data: media}] = await Promise.all([
    supabase
      .from('game_links')
      .select('*')
      .eq('game_id', game.id)
      .order('position', {ascending: true}),
    supabase
      .from('game_media')
      .select('*')
      .eq('game_id', game.id)
      .order('position', {ascending: true}),
  ]);

  // Track page view (fire-and-forget, don't block response)
  cf.cloudflare.ctx.waitUntil(
    trackEvent(env, {
      gameId: game.id,
      eventType: 'page_view',
      request,
    }),
  );

  // Campaign tracking: check for ?c= query param
  const url = new URL(request.url);
  const campaignSlug = url.searchParams.get('c');
  if (campaignSlug) {
    const {data: campaign} = await supabase
      .from('campaigns')
      .select('id, destination, destination_url, status')
      .eq('game_id', game.id)
      .eq('slug', campaignSlug)
      .single();

    if (campaign && campaign.status === 'active') {
      // Track click (fire-and-forget)
      cf.cloudflare.ctx.waitUntil(
        trackCampaignClick(env, {campaignId: campaign.id, request}),
      );

      // If destination is external, redirect
      if (campaign.destination !== 'game_page' && campaign.destination_url) {
        return new Response(null, {
          status: 302,
          headers: {Location: campaign.destination_url},
        }) as any;
      }
    }
  }

  return data(
    {
      game,
      page,
      links: (links || []) as GameLink[],
      media: (media || []) as GameMedia[],
    },
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

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?#]+)/);
  return match?.[1] ?? null;
}

function trackLinkClick(gameId: string, linkId: string) {
  navigator.sendBeacon(
    '/api/track',
    JSON.stringify({gameId, eventType: 'link_click', linkId}),
  );
}

export default function GamePage({loaderData}: Route.ComponentProps) {
  const {game, page, links, media} = loaderData;

  // Theme colors from page_config, with fallbacks
  const theme = (page.page_config as Record<string, unknown> | null)?.theme as
    | Record<string, string>
    | undefined;
  const bgColor = theme?.bgColor || '#030712';
  const textColor = theme?.textColor || '#ffffff';
  const linkColor = theme?.linkColor || '#818cf8';

  const description = game.description as string | null;
  const storeBadges = links.filter((l) => l.category === 'store');
  const hasLinks = links.length > 0;
  const hasDescription = !!description;
  const hasMedia = media.length > 0;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i < media.length - 1 ? i + 1 : i));
  }, [media.length]);
  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  return (
    <div className="min-h-screen" style={{background: bgColor, color: textColor}}>
      {game.header_url && (
        <div className="relative w-full overflow-hidden" style={{height: '31rem'}}>
          <img
            src={game.header_url}
            alt={`${game.title} header`}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '50%',
              background: `linear-gradient(to bottom, transparent, ${bgColor})`,
            }}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 relative -mt-[12rem] z-[1]">
        <h1 className="text-[3rem] leading-[1.1] font-bold">{game.title}</h1>

        {game.summary && (
          <p className="mt-2 text-lg" style={{color: textColor, opacity: 0.75}}>
            {game.summary}
          </p>
        )}

        {storeBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {storeBadges.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick(game.id, link.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium no-underline transition-opacity hover:opacity-80"
                style={{
                  background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${textColor} 15%, transparent)`,
                  color: textColor,
                }}
              >
                <span>{LINK_ICONS[link.type] || '🔗'}</span>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {hasMedia && (
          <div className="-mx-4 mt-6">
            <div className="flex gap-2 overflow-x-auto px-4 snap-x snap-mandatory" style={{scrollbarWidth: 'thin'}}>
              {media.map((item, index) => {
                const thumb = item.thumbnail_url || item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="flex-shrink-0 w-[17.5rem] aspect-video rounded-lg overflow-hidden relative snap-start transition-transform hover:scale-[1.02] cursor-pointer border-0 p-0 bg-transparent"
                  >
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white pointer-events-none">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(hasLinks || hasDescription) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {hasLinks && (
              <div className="flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackLinkClick(game.id, link.id)}
                    className="flex items-center gap-3 py-2.5 no-underline transition-opacity hover:opacity-70"
                  >
                    <span className="shrink-0 w-8 flex items-center justify-center text-lg" style={{color: textColor, opacity: 0.6}}>
                      {LINK_ICONS[link.type] || '🔗'}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="font-semibold text-[0.9375rem]" style={{color: textColor}}>
                        {link.label}
                      </span>
                      <span className="text-xs truncate" style={{color: textColor, opacity: 0.4}}>
                        {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            )}

            {hasDescription && (
              <div>
                <h2 className="text-lg font-semibold mb-4">About this game</h2>
                <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap" style={{color: textColor, opacity: 0.8}}>
                  {description}
                </p>
              </div>
            )}
          </div>
        )}

        {game.trailer_url && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Trailer</h2>
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

      {lightboxIndex !== null && media[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-10 right-0 bg-transparent border-0 text-white cursor-pointer opacity-70 hover:opacity-100 p-1"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {media[lightboxIndex].type === 'video' ? (
              <div className="w-[80vw] max-w-[960px] aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(media[lightboxIndex].url) || ''}?autoplay=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Video"
                  className="w-full h-full border-0 rounded-lg"
                />
              </div>
            ) : (
              <img
                src={media[lightboxIndex].url}
                alt=""
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              />
            )}

            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute top-1/2 -translate-y-1/2 -left-12 bg-transparent border-0 text-white cursor-pointer opacity-70 hover:opacity-100 p-2"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            {lightboxIndex < media.length - 1 && (
              <button
                type="button"
                onClick={goNext}
                className="absolute top-1/2 -translate-y-1/2 -right-12 bg-transparent border-0 text-white cursor-pointer opacity-70 hover:opacity-100 p-2"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
