import {PlusIcon} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router';
import {Button, Icon} from '@play/pylon';
import {
  ClaimOwnershipDialog,
  CreateGameDialog,
  filterAndSortGames,
  GamesGridView,
  GamesListView,
  GamesPageEmptyState,
  GamesPageLoadingState,
  GamesPageToolbar,
  isGamePublished,
  isGamesViewMode,
  isGamesVisibilityFilter,
  toGameRow,
  useGamesViewMode,
} from '@/components/games';
import type {
  GamesSortOption,
  GamesViewMode,
  GamesVisibilityFilter,
} from '@/components/games';
import {PageLayout} from '@/components/layout';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

export function GamesPage() {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const sort: GamesSortOption = 'recent';
  const {viewMode: storedViewMode, setViewMode: setStoredViewMode} =
    useGamesViewMode();

  const viewModeParam = searchParams.get('view');
  const visibilityFilterParam = searchParams.get('status');
  const claimParam = searchParams.get('claim');
  const claimSlugParam = (searchParams.get('claimSlug') || '')
    .trim()
    .toLowerCase();
  const claimSlugParamIsValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
    claimSlugParam,
  );
  const claimDialogOpenedFromQuery =
    claimParam === '1' || claimSlugParamIsValid;

  const viewMode = isGamesViewMode(viewModeParam)
    ? viewModeParam
    : storedViewMode;
  const visibilityFilter = isGamesVisibilityFilter(visibilityFilterParam)
    ? visibilityFilterParam
    : 'all';

  useEffect(() => {
    if (isGamesViewMode(viewModeParam) && viewModeParam !== storedViewMode) {
      setStoredViewMode(viewModeParam);
    }
  }, [viewModeParam, setStoredViewMode, storedViewMode]);

  const {data: games = [], isLoading} = trpc.game.list.useQuery({
    studioId: activeStudio.id,
  });

  const filteredGames = useMemo(
    () => filterAndSortGames(games, visibilityFilter, sort),
    [games, visibilityFilter, sort],
  );
  const publishedCount = useMemo(
    () => games.filter((game) => isGamePublished(game)).length,
    [games],
  );
  const draftCount = useMemo(
    () => games.length - publishedCount,
    [games.length, publishedCount],
  );

  const tableRows = useMemo(
    () => filteredGames.map(toGameRow),
    [filteredGames],
  );

  const setGamesSearchParams = useCallback(
    (values: {view?: GamesViewMode; status?: GamesVisibilityFilter}) => {
      const nextParams = new URLSearchParams(searchParams);

      if (values.view) nextParams.set('view', values.view);
      if (values.status) nextParams.set('status', values.status);

      setSearchParams(nextParams, {replace: true});
    },
    [searchParams, setSearchParams],
  );

  const clearClaimQueryParams = useCallback(() => {
    if (!searchParams.has('claimSlug') && !searchParams.has('claim')) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('claimSlug');
    nextParams.delete('claim');
    setSearchParams(nextParams, {replace: true});
  }, [searchParams, setSearchParams]);

  const handleViewModeChange = useCallback(
    (mode: GamesViewMode) => {
      setStoredViewMode(mode);
      setGamesSearchParams({view: mode});
    },
    [setGamesSearchParams, setStoredViewMode],
  );

  const handleVisibilityFilterChange = useCallback(
    (filter: GamesVisibilityFilter) => {
      setGamesSearchParams({status: filter});
    },
    [setGamesSearchParams],
  );

  const handleGameClick = useCallback(
    (gameId: string) => {
      navigate(`/${activeStudio.slug}/games/${gameId}`);
    },
    [activeStudio.slug, navigate],
  );

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Header title="Games" />
        <PageLayout.Content>
          <GamesPageLoadingState />
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header title="Games">
        <div className="flex items-center">
          <GamesPageToolbar
            visibilityFilter={visibilityFilter}
            onVisibilityFilterChange={handleVisibilityFilterChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
        </div>
        <div className="ml-auto flex items-center">
          <Button variant="primary" onClick={() => setCreateDialogOpen(true)}>
            <Icon icon={PlusIcon} size={16} className="mr-2" />
            New game
          </Button>
        </div>
      </PageLayout.Header>

      <PageLayout.Content className="pt-8">
        {filteredGames.length === 0 ? (
          <GamesPageEmptyState
            visibilityFilter={visibilityFilter}
            draftCount={draftCount}
            publishedCount={publishedCount}
            onCreateGame={() => setCreateDialogOpen(true)}
            onChangeVisibilityFilter={handleVisibilityFilterChange}
          />
        ) : viewMode === 'grid' ? (
          <GamesGridView games={filteredGames} onGameClick={handleGameClick} />
        ) : (
          <GamesListView rows={tableRows} onGameClick={handleGameClick} />
        )}
      </PageLayout.Content>

      <CreateGameDialog
        opened={createDialogOpen}
        setOpened={setCreateDialogOpen}
      />
      <ClaimOwnershipDialog
        opened={claimDialogOpenedFromQuery}
        setOpened={(opened) => {
          if (!opened) clearClaimQueryParams();
        }}
        targetStudioId={activeStudio.id}
        initialSlug={claimSlugParam || undefined}
      />
    </PageLayout>
  );
}
