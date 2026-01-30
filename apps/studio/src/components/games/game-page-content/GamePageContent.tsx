import styled from 'styled-components';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';

type GameLink = Tables<'game_links'>;

const LINK_ICONS: Record<string, string> = {
  steam: '🎮',
  itch: '🕹️',
  epic: '🎯',
  discord: '💬',
  youtube: '▶️',
  website: '🌐',
  demo: '🎲',
};

export interface GamePageTheme {
  bgColor: string;
  textColor: string;
  linkColor: string;
}

interface GamePageContentProps {
  game: GameOutletContext;
  links: GameLink[];
  theme: GamePageTheme;
}

export function GamePageContent({game, links, theme}: GamePageContentProps) {
  const {bgColor, textColor, linkColor} = theme;

  return (
    <Page style={{background: bgColor, color: textColor}}>
      {game.header_url && (
        <HeaderBanner>
          <img src={game.header_url} alt={`${game.title} header`} />
        </HeaderBanner>
      )}

      <Content>
        <Hero>
          {game.cover_url && (
            <CoverImage src={game.cover_url} alt={game.title} />
          )}
          <HeroInfo>
            <Title>{game.title}</Title>
            {game.summary && (
              <Summary style={{color: textColor, opacity: 0.75}}>
                {game.summary}
              </Summary>
            )}
            {game.genres && game.genres.length > 0 && (
              <Genres>
                {game.genres.map((genre: string) => (
                  <Genre
                    key={genre}
                    style={{
                      background: `color-mix(in srgb, ${textColor} 15%, transparent)`,
                      color: textColor,
                      opacity: 0.8,
                    }}
                  >
                    {genre}
                  </Genre>
                ))}
              </Genres>
            )}
          </HeroInfo>
        </Hero>

        {links.length > 0 && (
          <LinksSection>
            <SectionHeading>Links</SectionHeading>
            <LinksGrid>
              {links.map((link) => (
                <LinkItem
                  key={link.id}
                  as="a"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: `color-mix(in srgb, ${textColor} 5%, transparent)`,
                    borderColor: `color-mix(in srgb, ${textColor} 15%, transparent)`,
                  }}
                >
                  <LinkIcon>{LINK_ICONS[link.type] || '🔗'}</LinkIcon>
                  <LinkLabel style={{color: linkColor}}>{link.label}</LinkLabel>
                </LinkItem>
              ))}
            </LinksGrid>
          </LinksSection>
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
      </Content>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100%;
`;

const HeaderBanner = styled.div`
  width: 100%;
  height: 16rem;
  overflow: hidden;

  @media (min-width: 768px) {
    height: 24rem;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Content = styled.div`
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Hero = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
`;

const CoverImage = styled.img`
  width: 12rem;
  flex-shrink: 0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;

const HeroInfo = styled.div`
  flex: 1;
  padding-top: 0.5rem;
`;

const Title = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;
`;

const Summary = styled.p`
  margin: 0.5rem 0 0;
  font-size: 1.125rem;
`;

const Genres = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Genre = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
`;

const LinksSection = styled.div`
  margin-top: 2rem;
`;

const SectionHeading = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem;
`;

const LinksGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const LinkItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.8;
  }
`;

const LinkIcon = styled.span`
  font-size: 1.125rem;
`;

const LinkLabel = styled.span`
  font-weight: 500;
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
