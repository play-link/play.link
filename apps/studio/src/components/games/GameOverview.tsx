import {
  EyeIcon,
  GamepadIcon,
  GlobeIcon,
  PencilIcon,
  RocketIcon,
  ShareIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button} from '@play/pylon';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {trpc} from '@/lib/trpc';
import {ShareOverlay} from './ShareOverlay';

const STATUS_LABELS: Record<string, string> = {
  IN_DEVELOPMENT: 'In Development',
  UPCOMING: 'Upcoming',
  EARLY_ACCESS: 'Early Access',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
};

export function GameOverview() {
  const game = useOutletContext<GameOutletContext>();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);
  const isPublished = primaryPage?.visibility === 'PUBLISHED';
  const gameUrl = primaryPage ? `https://play.link/${primaryPage.slug}` : '';

  const utils = trpc.useUtils();

  const publish = trpc.gamePage.publish.useMutation({
    onSuccess: () => utils.game.get.invalidate({id: game.id}),
  });

  const unpublish = trpc.gamePage.unpublish.useMutation({
    onSuccess: () => utils.game.get.invalidate({id: game.id}),
  });

  const handleTogglePublish = () => {
    if (!primaryPage) return;
    if (isPublished) {
      unpublish.mutate({pageId: primaryPage.id});
    } else {
      publish.mutate({pageId: primaryPage.id});
    }
  };

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
              <BadgeRow>
                <StatusBadge $status={game.status}>
                  {STATUS_LABELS[game.status] || game.status}
                </StatusBadge>
                <PublishedBadge $published={isPublished}>
                  {isPublished ? 'Live' : 'Not published'}
                </PublishedBadge>
              </BadgeRow>
            </Cover>
            <CardInfo>
              <CardTitle>{game.title}</CardTitle>
            </CardInfo>
          </PreviewCard>

          {primaryPage && (
            <ShareBox>
              <ShareUrl>play.link/{primaryPage.slug}</ShareUrl>
              <ShareButton type="button" onClick={() => setShareOpen(true)}>
                <ShareIcon size={16} />
              </ShareButton>
            </ShareBox>
          )}

          <Button variant="nav" onClick={() => navigate('preview', {relative: 'path'})}>
            <EyeIcon size={16} className="mr-3" /> Preview page
          </Button>
          <Button variant="nav" onClick={() => navigate('design', {relative: 'path'})}>
            <PencilIcon size={16} className="mr-3" /> Edit page
          </Button>
          <Button
            variant="nav"
            onClick={handleTogglePublish}
            disabled={!primaryPage || publish.isPending || unpublish.isPending}
          >
            {isPublished ? (
              <>
                <GlobeIcon size={16} className="mr-3" /> Unpublish
              </>
            ) : (
              <>
                <RocketIcon size={16} className="mr-3" /> Publish
              </>
            )}
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

      {shareOpen && gameUrl && (
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
      case 'IN_DEVELOPMENT':
        return 'var(--color-yellow-600)';
      case 'CANCELLED':
        return 'var(--color-red-600)';
      default:
        return 'var(--bg-muted)';
    }
  }};
  color: var(--white);
`;

const BadgeRow = styled.div`
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  display: flex;
  gap: var(--spacing-1);
`;

const PublishedBadge = styled.span<{$published: boolean}>`
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  background: ${(p) => (p.$published ? 'var(--color-green-600)' : 'rgba(0, 0, 0, 0.6)')};
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
