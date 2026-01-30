import {PlusIcon} from 'lucide-react';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Button, Loading} from '@play/pylon';
import type {Tables} from '@play/supabase-client';
import {CreateGameDialog, GameCard} from '@/components/games';
import {PageLayout} from '@/components/layout';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

export function GamesPage() {
  const {activeOrganization} = useAppContext(ContextLevel.AuthenticatedWithOrg);
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {data: games = [], isLoading} = trpc.game.list.useQuery({
    organizationId: activeOrganization.id,
  });

  const handleGameClick = (gameId: string) => {
    navigate(`/${activeOrganization.slug}/games/${gameId}`);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Header title="Games" />
        <PageLayout.Content>
          <LoadingContainer>
            <Loading size="lg" />
          </LoadingContainer>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header
        title="Games"
        subtitle={`${games.length} game${games.length !== 1 ? 's' : ''}`}
      >
        <Button variant="primary" onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon size={18} />
          New Game
        </Button>
      </PageLayout.Header>

      <PageLayout.Content>
        {games.length === 0 ? (
          <EmptyState>
            <EmptyTitle>No games yet</EmptyTitle>
            <EmptyText>
              Create your first game to start building your play.link page.
            </EmptyText>
            <Button variant="primary" onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon size={18} />
              Create Your First Game
            </Button>
          </EmptyState>
        ) : (
          <GamesGrid>
            {games.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                slug={(game.pages as Tables<'game_pages'>[] | null)?.find((p) => p.is_primary)?.slug ?? ''}
                coverUrl={game.cover_url}
                status={game.status}
                onClick={() => handleGameClick(game.id)}
              />
            ))}
          </GamesGrid>
        )}
      </PageLayout.Content>

      <CreateGameDialog
        opened={createDialogOpen}
        setOpened={setCreateDialogOpen}
      />
    </PageLayout>
  );
}

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const GamesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--spacing-6);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-16) var(--spacing-6);
  background: var(--bg-surface);
  border: 1px dashed var(--border-muted);
  border-radius: var(--radius-xl);
`;

const EmptyTitle = styled.h2`
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0 0 var(--spacing-2);
`;

const EmptyText = styled.p`
  font-size: var(--text-base);
  color: var(--fg-muted);
  margin: 0 0 var(--spacing-6);
  max-width: 24rem;
`;
