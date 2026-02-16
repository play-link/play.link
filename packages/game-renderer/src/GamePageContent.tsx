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

export type ButtonStyle = 'glass' | 'solid' | 'outline';
export type ButtonRadius = 'sm' | 'md' | 'lg' | 'full';

export interface GamePageTheme {
  bgColor: string;
  textColor: string;
  linkColor: string;
  buttonStyle?: ButtonStyle;
  buttonRadius?: ButtonRadius;
  secondaryColor?: string;
  fontFamily?: string;
}

const BUTTON_RADIUS_MAP: Record<ButtonRadius, string> = {
  sm: '0',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
};

function getButtonStyles(textColor: string, style: ButtonStyle = 'glass', secondaryColor?: string): React.CSSProperties {
  const bg = secondaryColor || textColor;
  switch (style) {
    case 'solid':
      return {
        background: bg,
        borderColor: 'transparent',
        color: textColor,
      };
    case 'outline':
      return {
        background: 'transparent',
        borderColor: `color-mix(in srgb, ${textColor} 30%, transparent)`,
        color: textColor,
      };
    case 'glass':
    default:
      return {
        background: `color-mix(in srgb, ${bg} 18%, transparent)`,
        borderColor: `color-mix(in srgb, ${bg} 30%, transparent)`,
        color: textColor,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      };
  }
}

export interface GamePageGame {
  title: string;
  summary: string | null;
  about_the_game: string | unknown;
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
  /** When true, uses min-height: 100vh (for standalone pages). Default false (for embedded editor preview). */
  fullScreen?: boolean;
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
  fullScreen,
}: GamePageContentProps) {
  const {bgColor, textColor, linkColor, buttonStyle, buttonRadius, secondaryColor, fontFamily} = theme;
  const badgeStyles = getButtonStyles(textColor, buttonStyle, secondaryColor);
  const badgeRadius = BUTTON_RADIUS_MAP[buttonRadius || 'full'];
  const fontStyle: React.CSSProperties = fontFamily
    ? {fontFamily: `'${fontFamily}', sans-serif`, ...(fontFamily === 'Bebas Neue' ? {letterSpacing: '2px'} : {})}
    : {};

  const description = descriptionOverride ?? (game.about_the_game as string | null);
  const platformLinks = links.filter((l) => l.category === 'platform');
  const storeBadges = links.filter((l) => l.category === 'store');
  const otherLinks = links.filter((l) => l.category !== 'platform');
  const hasLinks = otherLinks.length > 0;
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
    <Page $fullScreen={!!fullScreen} style={{background: bgColor, color: textColor, ...fontStyle}}>
      <HeroWrapper style={{'--fade-color': bgColor} as React.CSSProperties}>
        <HeroSection
          style={game.header_url ? {backgroundImage: `url(${game.header_url})`} : undefined}
          $hasImage={!!game.header_url}
        >
          <HeroFade $hasImage={!!game.header_url} />
        </HeroSection>
      </HeroWrapper>

      <Content $hasHeader={!!game.header_url}>
        {headerActions ? (
          <TitleRow>
            <Title>{game.title}</Title>
            {headerActions}
          </TitleRow>
        ) : (
          <Title>{game.title}</Title>
        )}

        {(storeBadges.length > 0 || platformLinks.length > 0) && (
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
                  style={{...badgeStyles, borderRadius: badgeRadius}}
                >
                  <Icon size={18} />
                  {link.label}
                </PlatformBadge>
              );
            })}
            {platformLinks.map((link) => {
              const linkAny = link as Record<string, unknown>;
              const comingSoon = linkAny.coming_soon || linkAny.comingSoon;
              const label = `${link.label}${comingSoon ? ' - Coming soon' : ''}`;
              const Tag = link.url ? 'a' : 'span';
              return (
                <PlatformBadge
                  key={link.id}
                  as={Tag}
                  {...(link.url ? {href: link.url, target: '_blank', rel: 'noopener noreferrer'} : {})}
                  onClick={() => link.url && onLinkClick?.(link.id)}
                  style={{...badgeStyles, borderRadius: badgeRadius}}
                >
                  <Gamepad2Icon size={18} />
                  {label}
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

        {hasDescription && (
          <SingleColumn>
            <SectionHeading>About this game</SectionHeading>
            <Description style={{color: textColor, opacity: 0.8}}>
              {description}
            </Description>
          </SingleColumn>
        )}

        {hasLinks && (
          <SingleColumn>
            {otherLinks.map((link) => {
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
                    <Icon size={28} />
                  </LinkIconWrap>
                  <LinkInfo>
                    <LinkLabel style={{color: textColor}}>{link.label}</LinkLabel>
                    {link.url && (
                      <LinkUrl style={{color: secondaryColor || textColor, opacity: secondaryColor ? 0.8 : 0.4}}>
                        {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </LinkUrl>
                    )}
                  </LinkInfo>
                </LinkRow>
              );
            })}
          </SingleColumn>
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

const Page = styled.div<{$fullScreen?: boolean}>`
  min-height: ${(p) => (p.$fullScreen ? '100vh' : '100%')};
`;

const HeroWrapper = styled.div`
  max-width: var(--breakpoint-xl);
  margin: 0 auto;
`;

const HeroSection = styled.div<{$hasImage: boolean}>`
  position: relative;
  width: 70%;
  margin-left: auto;
  height: ${(p) => (p.$hasImage ? '24rem' : '6rem')};
  background-size: cover;
  background-position: center;

  @media (min-width: 768px) {
    height: ${(p) => (p.$hasImage ? '31rem' : '6rem')};
  }
`;

const HeroFade = styled.div<{$hasImage: boolean}>`
  position: absolute;
  inset: 0;
  background: ${(p) =>
    p.$hasImage
      ? 'linear-gradient(to right, var(--fade-color) 0, transparent 56%), linear-gradient(to top, var(--fade-color) 0, transparent 56%), linear-gradient(to left, var(--fade-color) 0, transparent 56%)'
      : 'var(--fade-color)'};
  pointer-events: none;
`;

const Content = styled.div<{$hasHeader: boolean}>`
  position: relative;
  max-width: var(--breakpoint-xl);
  margin: 0 auto;
  padding: 2rem 1rem;
  margin-top: ${(p) => (p.$hasHeader ? '-12rem' : '-4rem')};
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
  max-width: 50%;
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
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 9999px;
  font-size: 0.9375rem;
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
  width: 13.125rem;
  aspect-ratio: 16 / 9;
  border-radius: 0.75rem;
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

const SingleColumn = styled.div`
  margin-top: 2rem;
`;

const LinkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 0;
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
  width: 3rem;
`;

const LinkInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const LinkLabel = styled.span`
  font-weight: 700;
  font-size: 1.375rem;
`;

const LinkUrl = styled.span`
  font-size: 0.875rem;
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
