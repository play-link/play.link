import {ArrowLeftIcon, CopyIcon, ExternalLinkIcon, GamepadIcon, ShareIcon, XIcon} from 'lucide-react';
import {useState} from 'react';
import {Link} from 'react-router';
import styled from 'styled-components';
import {Button, Loading} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

interface GameEditorProps {
  gameId: string;
}

type Tab = 'overview' | 'analytics';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  UPCOMING: 'Upcoming',
  EARLY_ACCESS: 'Early Access',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
};

export function GameEditor({gameId}: GameEditorProps) {
  const {activeOrganization} = useAppContext(ContextLevel.AuthenticatedWithOrg);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const {data: game, isLoading} = trpc.game.get.useQuery({id: gameId});

  const gameUrl = game ? `https://play.link/${game.slug}` : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: game?.title,
        url: gameUrl,
      });
    }
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <Loading size="lg" />
      </LoadingContainer>
    );
  }

  if (!game) {
    return (
      <Container>
        <p>Game not found</p>
        <Link to={`/${activeOrganization.slug}/games`}>
          <Button variant="ghost">Back to Games</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container>
      <TopBar>
        <BackLink to={`/${activeOrganization.slug}/games`}>
          <ArrowLeftIcon size={20} />
          Back to Games
        </BackLink>
      </TopBar>

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
        </Sidebar>

        <Main>
          <TabNav>
            <Button
              variant="nav"
              size="sm"
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Button>
            <Button
              variant="nav"
              size="sm"
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </Button>
          </TabNav>

          <TabContent>
            {activeTab === 'overview' && (
              <Placeholder>
                <PlaceholderText>Overview</PlaceholderText>
                <PlaceholderSubtext>
                  Edit your game's details, links, and content.
                </PlaceholderSubtext>
              </Placeholder>
            )}
            {activeTab === 'analytics' && (
              <Placeholder>
                <PlaceholderText>Analytics</PlaceholderText>
                <PlaceholderSubtext>View your game's performance and metrics.</PlaceholderSubtext>
              </Placeholder>
            )}
          </TabContent>
        </Main>
      </Layout>

      {shareOpen && (
        <ShareOverlayBackdrop onClick={() => setShareOpen(false)}>
          <ShareOverlay onClick={(e) => e.stopPropagation()}>
            <ShareOverlayHeader>
              <ShareOverlayTitle>Share</ShareOverlayTitle>
              <CloseButton type="button" onClick={() => setShareOpen(false)}>
                <XIcon size={18} />
              </CloseButton>
            </ShareOverlayHeader>

            <ShareOverlayUrl>
              <ShareOverlayUrlText>{gameUrl}</ShareOverlayUrlText>
            </ShareOverlayUrl>

            <ShareActions>
              <ShareAction type="button" onClick={handleCopy}>
                <CopyIcon size={18} />
                {copied ? 'Copied!' : 'Copy link'}
              </ShareAction>
              <ShareAction
                as="a"
                href={gameUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon size={18} />
                Open in browser
              </ShareAction>
              {typeof navigator.share === 'function' && (
                <ShareAction type="button" onClick={handleNativeShare}>
                  <ShareIcon size={18} />
                  More options
                </ShareAction>
              )}
            </ShareActions>
          </ShareOverlay>
        </ShareOverlayBackdrop>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: var(--spacing-8);
  max-width: 64rem;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const TopBar = styled.div`
  margin-bottom: var(--spacing-6);
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--fg-muted);
  font-size: var(--text-sm);
  transition: color 0.15s;

  &:hover {
    color: var(--fg);
  }
`;

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

// Preview card (static, non-clickable)
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

// Share link box
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
  transition: color 0.15s, background-color 0.15s;

  &:hover {
    color: var(--fg);
    background: var(--bg-hover);
  }
`;

// Main content area
const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
`;

const TabNav = styled.div`
  display: flex;
  gap: var(--spacing-1);
`;

const TabContent = styled.div`
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

// Share overlay
const ShareOverlayBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShareOverlay = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
`;

const ShareOverlayHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ShareOverlayTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const CloseButton = styled.button`
  padding: var(--spacing-1);
  border-radius: var(--radius-md);
  color: var(--fg-muted);
  transition: color 0.15s, background-color 0.15s;

  &:hover {
    color: var(--fg);
    background: var(--bg-hover);
  }
`;

const ShareOverlayUrl = styled.div`
  background: var(--bg-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
`;

const ShareOverlayUrlText = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  word-break: break-all;
`;

const ShareActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const ShareAction = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--fg);
  transition: background-color 0.15s;
  text-decoration: none;

  &:hover {
    background: var(--bg-hover);
  }
`;
