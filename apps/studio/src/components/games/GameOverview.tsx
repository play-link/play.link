import {
  EyeIcon,
  GamepadIcon,
  PencilIcon,
  RocketIcon,
  ShareIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button} from '@play/pylon';
import type {GameOutletContext} from '@/pages/GamePage';
import {ShareOverlay} from './ShareOverlay';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  UPCOMING: 'Upcoming',
  EARLY_ACCESS: 'Early Access',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
};

export function GameOverview() {
  const game = useOutletContext<GameOutletContext>();
  const [shareOpen, setShareOpen] = useState(false);
  const gameUrl = `https://play.link/${game.slug}`;

  return (
    <>
      <Layout>
        <Sidebar>
          <PreviewCard>
            <Cover>
              {game.cover_url ? (
                <CoverImage src={game.cover_url} alt={game.title} />
              ) : (
                <CoverPlaceholder>
                  <GamepadIcon size={48} />
                </CoverPlaceholder>
              )}
              <StatusBadge $status={game.status}>
                {STATUS_LABELS[game.status] || game.status}
              </StatusBadge>
            </Cover>
            <CardInfo>
              <CardTitle>{game.title}</CardTitle>
            </CardInfo>
          </PreviewCard>

          <ShareBox>
            <ShareUrl>play.link/{game.slug}</ShareUrl>
            <ShareButton type="button" onClick={() => setShareOpen(true)}>
              <ShareIcon size={16} />
            </ShareButton>
          </ShareBox>

          <Button variant="nav">
            <EyeIcon size={16} className="mr-3" /> Preview page
          </Button>
          <Button variant="nav">
            <PencilIcon size={16} className="mr-3" /> Edit page
          </Button>
          <Button variant="nav">
            <RocketIcon size={16} className="mr-3" /> Publish
          </Button>
        </Sidebar>

        <Main>
          <Placeholder>
            <PlaceholderText>Overview</PlaceholderText>
            <PlaceholderSubtext>
              Edit your game's details, links, and content.
            </PlaceholderSubtext>
          </Placeholder>
        </Main>
      </Layout>

      {shareOpen && (
        <ShareOverlay
          gameUrl={gameUrl}
          gameTitle={game.title}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-8);
  align-items: start;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  position: sticky;
  top: var(--spacing-8);
`;

const PreviewCard = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  overflow: hidden;
`;

const Cover = styled.div`
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  background: var(--bg-muted);
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CoverPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-subtle);
`;

const StatusBadge = styled.span<{$status: string}>`
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  background: ${(p) => {
    switch (p.$status) {
      case 'RELEASED':
        return 'var(--color-green-600)';
      case 'EARLY_ACCESS':
        return 'var(--color-blue-600)';
      case 'UPCOMING':
        return 'var(--color-purple-600)';
      case 'CANCELLED':
        return 'var(--color-red-600)';
      default:
        return 'var(--bg-muted)';
    }
  }};
  color: var(--white);
`;

const CardInfo = styled.div`
  padding: var(--spacing-4);
`;

const CardTitle = styled.h3`
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const ShareBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2) var(--spacing-3);
`;

const ShareUrl = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ShareButton = styled.button`
  flex-shrink: 0;
  padding: var(--spacing-1);
  border-radius: var(--radius-md);
  color: var(--fg-muted);
  transition:
    color 0.15s,
    background-color 0.15s;

  &:hover {
    color: var(--fg);
    background: var(--bg-hover);
  }
`;

const Main = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  min-height: 24rem;
`;

const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 24rem;
  text-align: center;
`;

const PlaceholderText = styled.p`
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  margin: 0;
`;

const PlaceholderSubtext = styled.p`
  font-size: var(--text-base);
  color: var(--fg-subtle);
  margin: var(--spacing-2) 0 0;
`;
