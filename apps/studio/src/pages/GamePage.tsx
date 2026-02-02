import {Link, Outlet, useLocation, useNavigate, useParams} from 'react-router';
import type {AppRouter} from '@play/api/trpc';
import type {inferRouterOutputs} from '@trpc/server';
import styled from 'styled-components';
import {Button, Loading} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

export type GameOutletContext = inferRouterOutputs<AppRouter>['game']['get'];

type Tab = 'overview' | 'updates' | 'settings';

function useActiveTab(): Tab {
  const location = useLocation();
  const parts = location.pathname.split('/');
  const segment = parts[parts.length - 1];
  const parentSegment = parts[parts.length - 2];
  if (segment === 'settings') return 'settings';
  if (segment === 'updates' || parentSegment === 'updates') return 'updates';
  return 'overview';
}

function useIsFullscreen(): boolean {
  const location = useLocation();
  const segment = location.pathname.split('/').pop();
  return segment === 'preview' || segment === 'design';
}

export function GamePage() {
  const {gameId} = useParams<{gameId: string}>();
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const navigate = useNavigate();
  const activeTab = useActiveTab();
  const isFullscreen = useIsFullscreen();

  const basePath = `/${activeStudio.slug}/games/${gameId}`;

  const {data: game, isLoading} = trpc.game.get.useQuery(
    {id: gameId!},
    {enabled: !!gameId},
  );

  if (!gameId) {
    return <div>Game not found</div>;
  }

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
        <Link to={`/${activeStudio.slug}/games`}>
          <Button variant="ghost">Back to Games</Button>
        </Link>
      </Container>
    );
  }

  if (isFullscreen) {
    return <Outlet context={game} />;
  }

  return (
    <Container>
      <TopBar>
        <GameTitle>{game.title}</GameTitle>
      </TopBar>

      <TabNav>
        <Button
          variant="nav"
          size="sm"
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => navigate(basePath)}
        >
          Overview
        </Button>
        <Button
          variant="nav"
          size="sm"
          className={activeTab === 'updates' ? 'active' : ''}
          onClick={() => navigate(`${basePath}/updates`)}
        >
          Updates
        </Button>
        <Button
          variant="nav"
          size="sm"
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => navigate(`${basePath}/settings`)}
        >
          Settings
        </Button>
      </TabNav>

      <Content>
        <Outlet context={game} />
      </Content>
    </Container>
  );
}

const Container = styled.div`
  padding: var(--spacing-8);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
`;

const GameTitle = styled.h1`
  font-size: var(--text-5xl);
  font-weight: var(--font-weight-bold);
  color: var(--fg);
  margin: 0;
`;

const TabNav = styled.div`
  display: flex;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-6);
`;

const Content = styled.div`
  min-height: 24rem;
`;
