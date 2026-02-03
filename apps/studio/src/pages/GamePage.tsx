import {Link, Outlet, useLocation, useNavigate, useParams} from 'react-router';
import type {AppRouter} from '@play/api/trpc';
import type {inferRouterOutputs} from '@trpc/server';
import {Button, Loading, TabNav, TabNavItem} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {PageLayout} from '@/components/layout';
import {trpc} from '@/lib/trpc';

export type GameOutletContext = inferRouterOutputs<AppRouter>['game']['get'];

type Tab = 'overview' | 'updates' | 'info' | 'settings';

function useActiveTab(): Tab {
  const location = useLocation();
  const parts = location.pathname.split('/');
  const segment = parts[parts.length - 1];
  const parentSegment = parts[parts.length - 2];
  if (segment === 'settings') return 'settings';
  if (segment === 'info') return 'info';
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
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (!game) {
    return (
      <PageLayout>
        <p>Game not found</p>
        <Link to={`/${activeStudio.slug}/games`}>
          <Button variant="ghost">Back to Games</Button>
        </Link>
      </PageLayout>
    );
  }

  if (isFullscreen) {
    return <Outlet context={game} />;
  }

  return (
    <PageLayout>
      <PageLayout.Header
        title={game.title}
        tabNav={
          <TabNav bleeding={10}>
            <TabNavItem
              active={activeTab === 'overview'}
              onClick={() => navigate(basePath)}
            >
              Overview
            </TabNavItem>
            <TabNavItem
              active={activeTab === 'updates'}
              onClick={() => navigate(`${basePath}/updates`)}
            >
              Updates
            </TabNavItem>
            <TabNavItem
              active={activeTab === 'info'}
              onClick={() => navigate(`${basePath}/info`)}
            >
              Info
            </TabNavItem>
            <TabNavItem
              active={activeTab === 'settings'}
              onClick={() => navigate(`${basePath}/settings`)}
            >
              Settings
            </TabNavItem>
          </TabNav>
        }
      />
      <PageLayout.Content>
        <Outlet context={game} />
      </PageLayout.Content>
    </PageLayout>
  );
}
