import {Link, Outlet, useLocation, useNavigate, useParams} from 'react-router';
import type {AppRouter} from '@play/api/trpc';
import type {inferRouterOutputs} from '@trpc/server';
import {
  Button,
  Loading,
  SegmentedControls,
} from '@play/pylon';
import {PageLayout} from '@/components/layout';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

export type GameOutletContext = inferRouterOutputs<AppRouter>['game']['get'];

type Tab = 'overview' | 'updates' | 'content' | 'settings';

function useActiveTab(): Tab {
  const location = useLocation();
  const parts = location.pathname.split('/');
  const segment = parts[parts.length - 1];
  const parentSegment = parts[parts.length - 2];
  if (segment === 'settings') return 'settings';
  if (segment === 'content') return 'content';
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
      <PageLayout.Header title={game.title}>
        {/*  <IconButton
          icon={ArrowLeftIcon}
          onClick={() => navigate(`/${activeStudio.slug}/games`)}
          variant="filled"
          className="mr-3"
        /> */}
        <SegmentedControls
          value={activeTab}
          items={[
            {label: 'Overview', value: 'overview'},
            {label: 'Content', value: 'content'},
            {label: 'Updates', value: 'updates'},
            {label: 'Settings', value: 'settings'},
          ]}
          onChange={(item) => {
            const paths: Record<Tab, string> = {
              overview: basePath,
              content: `${basePath}/content`,
              updates: `${basePath}/updates`,
              settings: `${basePath}/settings`,
            };
            navigate(paths[item.value as Tab]);
          }}
        />
      </PageLayout.Header>
      <PageLayout.Content className="mt-6">
        <Outlet context={game} />
      </PageLayout.Content>
    </PageLayout>
  );
}
