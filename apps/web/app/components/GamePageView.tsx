import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Gamepad2Icon,
  GlobeIcon,
  LinkIcon,
  MessageCircleIcon,
  PlayIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {Tables} from '@play/supabase-client';

type GameLink = Tables<'game_links'>;
type GameMedia = Tables<'game_media'>;

export interface GameUpdate {
  id: string;
  title: string;
  body: string;
  cta_url: string | null;
  cta_label: string | null;
  published_at: string | null;
}

const LINK_ICON_MAP: Record<string, LucideIcon> = {
  steam: Gamepad2Icon,
  itch: Gamepad2Icon,
  epic: Gamepad2Icon,
  discord: MessageCircleIcon,
  youtube: VideoIcon,
  website: GlobeIcon,
  demo: PlayIcon,
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

interface GamePageViewProps {
  game: Tables<'games'>;
  page: Tables<'game_pages'>;
  links: Tables<'game_links'>[];
  media: Tables<'game_media'>[];
  updates: GameUpdate[];
}

export function GamePageView({game, page, links, media, updates}: GamePageViewProps) {
  const themeConfig = (page.page_config as Record<string, unknown> | null)?.theme as
    | Record<string, string>
    | undefined;
  const bgColor = themeConfig?.bgColor || '#030712';
  const textColor = themeConfig?.textColor || '#ffffff';
  const linkColor = themeConfig?.linkColor || '#818cf8';

  const description = game.description as string | null;
  const storeBadges = links.filter((l: GameLink) => l.category === 'store');
  const hasLinks = links.length > 0;
  const hasDescription = !!description;
  const hasMedia = media.length > 0;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const mediaScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollArrows = useCallback(() => {
    const el = mediaScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = mediaScrollRef.current;
    if (!el) return;
    updateScrollArrows();
    el.addEventListener('scroll', updateScrollArrows, {passive: true});
    return () => el.removeEventListener('scroll', updateScrollArrows);
  }, [updateScrollArrows]);

  const scrollMedia = useCallback((direction: 'left' | 'right') => {
    const el = mediaScrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth'});
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    setLightboxIndex((i: number | null) => (i !== null && i < media.length - 1 ? i + 1 : i));
  }, [media.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((i: number | null) => (i !== null && i > 0 ? i - 1 : i));
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

  const handleSubscribe = useCallback(async () => {
    if (!subEmail.trim()) return;
    setSubStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({gameId: game.id, email: subEmail.trim()}),
      });
      if (!res.ok) throw new Error('Subscribe failed');
      setSubStatus('success');
    } catch {
      setSubStatus('error');
    }
  }, [subEmail, game.id]);

  return (
    <>
      <div className="min-h-screen" style={{background: bgColor, color: textColor}}>
        {/* Header Banner */}
        {game.header_url && (
          <div className="relative w-full h-96 md:h-124 overflow-hidden">
            <img
              src={game.header_url}
              alt={`${game.title} header`}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
              style={{background: `linear-gradient(to bottom, transparent, ${bgColor})`}}
            />
          </div>
        )}

        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 py-8 -mt-48 z-1">
          {/* Title + Subscribe */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-5xl font-bold leading-tight m-0">{game.title}</h1>
            <button
              type="button"
              onClick={() => { setShowSubscribe(true); setSubStatus('idle'); }}
              title="Get updates"
              className="shrink-0 mt-3 p-2 rounded-full border-0 cursor-pointer transition-opacity hover:opacity-80"
              style={{
                background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                color: textColor,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </button>
          </div>

          {/* Summary */}
          {game.summary && (
            <p className="mt-2 text-lg" style={{color: textColor, opacity: 0.75}}>
              {game.summary}
            </p>
          )}

          {/* Store Badges */}
          {storeBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {storeBadges.map((link: GameLink) => {
                const Icon = LINK_ICON_MAP[link.type] || LinkIcon;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackLinkClick(game.id, link.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[0.8125rem] font-medium no-underline whitespace-nowrap transition-opacity hover:opacity-80"
                    style={{
                      background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                      borderColor: `color-mix(in srgb, ${textColor} 15%, transparent)`,
                      color: textColor,
                    }}
                  >
                    <Icon size={14} />
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* Media Strip */}
          {hasMedia && (
            <div className="group relative mt-6 -mx-4">
              <div
                ref={mediaScrollRef}
                className="flex gap-2 overflow-x-auto scroll-snap-x-mandatory px-4 scrollbar-hide"
                style={{scrollbarWidth: 'none'}}
              >
                {media.map((item: GameMedia, index: number) => {
                  const thumb = item.thumbnail_url || item.url;
                  return (
                    <div
                      key={item.id}
                      className="shrink-0 w-70 aspect-video rounded-lg overflow-hidden cursor-pointer relative snap-start transition-transform hover:scale-[1.02]"
                      onClick={() => setLightboxIndex(index)}
                    >
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white pointer-events-none">
                          <PlayIcon size={32} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollMedia('left')}
                  className="hidden md:flex absolute top-1/2 left-2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full border-0 bg-black/70 text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeftIcon size={18} />
                </button>
              )}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollMedia('right')}
                  className="hidden md:flex absolute top-1/2 right-2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full border-0 bg-black/70 text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRightIcon size={18} />
                </button>
              )}
            </div>
          )}

          {/* Links + Description */}
          {(hasLinks || hasDescription) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {hasLinks && (
                <div className="flex flex-col gap-1">
                  {links.map((link: GameLink) => {
                    const Icon = LINK_ICON_MAP[link.type] || LinkIcon;
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackLinkClick(game.id, link.id)}
                        className="flex items-center gap-3 py-2.5 no-underline transition-opacity hover:opacity-70"
                        style={{color: textColor}}
                      >
                        <span className="shrink-0 flex items-center justify-center w-8" style={{opacity: 0.6}}>
                          <Icon size={18} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-[0.9375rem]">{link.label}</span>
                          <span className="text-xs truncate" style={{opacity: 0.4}}>
                            {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {hasDescription && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 mt-0">About this game</h2>
                  <div
                    className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap"
                    style={{color: textColor, opacity: 0.8}}
                  >
                    {description}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trailer */}
          {game.trailer_url && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4 mt-0">Trailer</h2>
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

          {/* Updates */}
          {updates.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4 mt-0">Latest Updates</h2>
              <div className="flex flex-col gap-4">
                {updates.map((u: GameUpdate) => (
                  <div
                    key={u.id}
                    className="rounded-lg p-4"
                    style={{
                      background: `color-mix(in srgb, ${textColor} 5%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${textColor} 10%, transparent)`,
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-[0.9375rem] m-0">{u.title}</h3>
                      {u.published_at && (
                        <span className="text-xs shrink-0" style={{color: textColor, opacity: 0.4}}>
                          {new Date(u.published_at).toLocaleDateString('en', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap m-0"
                      style={{color: textColor, opacity: 0.75}}
                    >
                      {u.body.length > 300 ? `${u.body.slice(0, 300)}...` : u.body}
                    </p>
                    {u.cta_url && (
                      <a
                        href={u.cta_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-sm font-medium no-underline"
                        style={{color: linkColor}}
                      >
                        {u.cta_label || 'Learn more'} →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxIndex !== null && media[lightboxIndex] && (
          <div
            className="fixed inset-0 z-10000 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute -top-10 right-0 bg-transparent border-0 text-white cursor-pointer opacity-70 hover:opacity-100 p-1"
              >
                <XIcon size={24} />
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
                  className="absolute top-1/2 -left-12 -translate-y-1/2 bg-transparent border-0 text-white cursor-pointer opacity-70 hover:opacity-100 p-2"
                >
                  <ChevronLeftIcon size={32} />
                </button>
              )}
              {lightboxIndex < media.length - 1 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute top-1/2 -right-12 -translate-y-1/2 bg-transparent border-0 text-white cursor-pointer opacity-70 hover:opacity-100 p-2"
                >
                  <ChevronRightIcon size={32} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subscribe Modal */}
      {showSubscribe && (
        <div
          className="fixed inset-0 z-9999 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowSubscribe(false)}
        >
          <div
            className="relative w-full max-w-96 rounded-xl p-6"
            style={{background: bgColor, border: `1px solid color-mix(in srgb, ${textColor} 15%, transparent)`}}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSubscribe(false)}
              className="absolute top-3 right-3 bg-transparent border-0 cursor-pointer opacity-60 p-1"
              style={{color: textColor}}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {subStatus === 'success' ? (
              <div className="text-center py-4">
                <p className="text-lg font-semibold mb-1">You're subscribed!</p>
                <p className="text-sm m-0" style={{color: textColor, opacity: 0.6}}>
                  You'll receive updates about {game.title}.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">Get updates</h3>
                <p className="text-sm mb-4" style={{color: textColor, opacity: 0.6}}>
                  Subscribe to receive news about {game.title}.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                    className="flex-1 px-3 py-2 rounded-lg border-0 text-sm outline-none"
                    style={{
                      background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                      color: textColor,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={subStatus === 'loading' || !subEmail.trim()}
                    className="px-4 py-2 rounded-lg border-0 text-sm font-medium cursor-pointer text-white"
                    style={{
                      background: linkColor,
                      opacity: (subStatus === 'loading' || !subEmail.trim()) ? 0.5 : 1,
                    }}
                  >
                    {subStatus === 'loading' ? '...' : 'Subscribe'}
                  </button>
                </div>
                {subStatus === 'error' && (
                  <p className="text-sm mt-2 text-red-500">
                    Something went wrong. Please try again.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
