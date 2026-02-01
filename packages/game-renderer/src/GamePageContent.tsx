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
import type {ReactNode} from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import type {Tables} from '@play/supabase-client';

type GameLink = Tables<'game_links'>;
type GameMedia = Tables<'game_media'>;

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

export interface GamePageTheme {
  bgColor: string;
  textColor: string;
  linkColor: string;
}

export interface GamePageGame {
  title: string;
  summary: string | null;
  description: string | unknown;
  header_url: string | null;
  trailer_url: string | null;
}

export interface GamePageContentProps {
  game: GamePageGame;
  links: GameLink[];
  media: GameMedia[];
  theme: GamePageTheme;
  descriptionOverride?: string;
  /** Rendered next to the title (e.g. subscribe button) */
  headerActions?: ReactNode;
  /** Rendered after the main content, before the lightbox (e.g. updates section) */
  children?: ReactNode;
  /** Called when a link is clicked */
  onLinkClick?: (linkId: string) => void;
}

export function GamePageContent({
  game,
  links,
  media,
  theme,
  descriptionOverride,
  headerActions,
  children,
  onLinkClick,
}: GamePageContentProps) {
  const {bgColor, textColor, linkColor} = theme;

  const description = descriptionOverride ?? (game.description as string | null);
  const storeBadges = links.filter((l) => l.category === 'store');
  const hasLinks = links.length > 0;
  const hasDescription = !!description;
  const hasMedia = media.length > 0;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  return (
    <Page style={{background: bgColor, color: textColor}}>
      {game.header_url && (
        <HeaderBanner style={{'--fade-color': bgColor} as React.CSSProperties}>
          <img src={game.header_url} alt={`${game.title} header`} />
          <HeaderFade />
        </HeaderBanner>
      )}

      <Content>
        {headerActions ? (
          <TitleRow>
            <Title>{game.title}</Title>
            {headerActions}
          </TitleRow>
        ) : (
          <Title>{game.title}</Title>
        )}

        {game.summary && (
          <Summary style={{color: textColor, opacity: 0.75}}>
            {game.summary}
          </Summary>
        )}

        {storeBadges.length > 0 && (
          <PlatformBadges>
            {storeBadges.map((link) => {
              const Icon = LINK_ICON_MAP[link.type] || LinkIcon;
              return (
                <PlatformBadge
                  key={link.id}
                  as="a"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link.id)}
                  style={{
                    background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                    borderColor: `color-mix(in srgb, ${textColor} 15%, transparent)`,
                    color: textColor,
                  }}
                >
                  <Icon size={14} />
                  {link.label}
                </PlatformBadge>
              );
            })}
          </PlatformBadges>
        )}

        {hasMedia && (
          <MediaStripContainer>
            <MediaStripScroll ref={mediaScrollRef}>
              {media.map((item, index) => {
                const thumb = item.thumbnail_url || item.url;
                return (
                  <MediaStripItem
                    key={item.id}
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img src={thumb} alt="" />
                    {item.type === 'video' && (
                      <MediaPlayOverlay>
                        <PlayIcon size={32} />
                      </MediaPlayOverlay>
                    )}
                  </MediaStripItem>
                );
              })}
            </MediaStripScroll>
            {canScrollLeft && (
              <MediaScrollArrow $side="left" onClick={() => scrollMedia('left')}>
                <ChevronLeftIcon size={18} />
              </MediaScrollArrow>
            )}
            {canScrollRight && (
              <MediaScrollArrow $side="right" onClick={() => scrollMedia('right')}>
                <ChevronRightIcon size={18} />
              </MediaScrollArrow>
            )}
          </MediaStripContainer>
        )}

        {(hasLinks || hasDescription) && (
          <TwoColumns>
            {hasLinks && (
              <LeftColumn>
                {links.map((link) => {
                  const Icon = LINK_ICON_MAP[link.type] || LinkIcon;
                  return (
                    <LinkRow
                      key={link.id}
                      as="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onLinkClick?.(link.id)}
                    >
                      <LinkIconWrap style={{color: textColor, opacity: 0.6}}>
                        <Icon size={18} />
                      </LinkIconWrap>
                      <LinkInfo>
                        <LinkLabel style={{color: textColor}}>{link.label}</LinkLabel>
                        <LinkUrl style={{color: textColor, opacity: 0.4}}>
                          {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </LinkUrl>
                      </LinkInfo>
                    </LinkRow>
                  );
                })}
              </LeftColumn>
            )}

            {hasDescription && (
              <RightColumn>
                <SectionHeading>About this game</SectionHeading>
                <Description style={{color: textColor, opacity: 0.8}}>
                  {description}
                </Description>
              </RightColumn>
            )}
          </TwoColumns>
        )}

        {game.trailer_url && (
          <TrailerSection>
            <SectionHeading>Trailer</SectionHeading>
            <TrailerLink
              href={game.trailer_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{color: linkColor}}
            >
              Watch trailer
            </TrailerLink>
          </TrailerSection>
        )}

        {children}
      </Content>

      {lightboxIndex !== null && media[lightboxIndex] && (
        <LightboxBackdrop onClick={closeLightbox}>
          <LightboxContent onClick={(e) => e.stopPropagation()}>
            <LightboxClose onClick={closeLightbox}>
              <XIcon size={24} />
            </LightboxClose>

            {media[lightboxIndex].type === 'video' ? (
              <LightboxVideo>
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(media[lightboxIndex].url) || ''}?autoplay=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Video"
                />
              </LightboxVideo>
            ) : (
              <LightboxImage>
                <img src={media[lightboxIndex].url} alt="" />
              </LightboxImage>
            )}

            {lightboxIndex > 0 && (
              <LightboxNav $side="left" onClick={goPrev}>
                <ChevronLeftIcon size={32} />
              </LightboxNav>
            )}
            {lightboxIndex < media.length - 1 && (
              <LightboxNav $side="right" onClick={goNext}>
                <ChevronRightIcon size={32} />
              </LightboxNav>
            )}
          </LightboxContent>
        </LightboxBackdrop>
      )}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100%;
`;

const HeaderBanner = styled.div`
  width: 100%;
  height: 24rem;
  position: relative;
  overflow: hidden;

  @media (min-width: 768px) {
    height: 31rem;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const HeaderFade = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, transparent, var(--fade-color));
  pointer-events: none;
`;

const Content = styled.div`
  position: relative;
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1rem;
  margin-top: -12rem;
  z-index: 1;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.1;
`;

const Summary = styled.p`
  margin: 0.5rem 0 0;
  font-size: 1.125rem;
`;

const PlatformBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const PlatformBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s;
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }
`;

/* ── Media Strip ── */

const MediaStripContainer = styled.div`
  position: relative;
  margin-top: 1.5rem;
  margin-left: -1rem;
  margin-right: -1rem;

  &:hover ${() => MediaScrollArrow} {
    opacity: 1;
  }
`;

const MediaStripScroll = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0 1rem;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const MediaScrollArrow = styled.button<{$side: 'left' | 'right'}>`
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({$side}) => ($side === 'left' ? 'left: 0.5rem;' : 'right: 0.5rem;')}
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const MediaStripItem = styled.div`
  flex-shrink: 0;
  width: 17.5rem;
  aspect-ratio: 16 / 9;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  scroll-snap-align: start;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MediaPlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: white;
  pointer-events: none;
`;

/* ── Lightbox ── */

const LightboxBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LightboxContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
`;

const LightboxClose = styled.button`
  position: absolute;
  top: -2.5rem;
  right: 0;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  padding: 0.25rem;

  &:hover {
    opacity: 1;
  }
`;

const LightboxImage = styled.div`
  img {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 0.5rem;
  }
`;

const LightboxVideo = styled.div`
  width: 80vw;
  max-width: 960px;
  aspect-ratio: 16 / 9;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 0.5rem;
  }
`;

const LightboxNav = styled.button<{$side: 'left' | 'right'}>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({$side}) => ($side === 'left' ? 'left: -3rem;' : 'right: -3rem;')}
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  padding: 0.5rem;

  &:hover {
    opacity: 1;
  }
`;

/* ── Two Column Layout ── */

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const RightColumn = styled.div``;

const LinkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0;
  text-decoration: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.7;
  }
`;

const LinkIconWrap = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
`;

const LinkInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const LinkLabel = styled.span`
  font-weight: 600;
  font-size: 0.9375rem;
`;

const LinkUrl = styled.span`
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SectionHeading = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
`;

const Description = styled.div`
  font-size: 0.9375rem;
  line-height: 1.7;
  white-space: pre-wrap;
`;

const TrailerSection = styled.div`
  margin-top: 2rem;
`;

const TrailerLink = styled.a`
  text-decoration: underline;

  &:hover {
    opacity: 0.8;
  }
`;
