import {FileTextIcon, PlusIcon} from 'lucide-react';
import {useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button, Loading} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';
import type {GameOutletContext} from '@/pages/GamePage';
import {CreateGameUpdate} from './CreateGameUpdate';

export function GameUpdates() {
  const game = useOutletContext<GameOutletContext>();
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const navigate = useNavigate();

  const basePath = `/${activeStudio.slug}/games/${game.id}`;

  const [showCreate, setShowCreate] = useState(false);

  const {data: updates, isLoading} = trpc.gameUpdate.list.useQuery({
    gameId: game.id,
  });

  if (isLoading) {
    return (
      <LoadingContainer>
        <Loading size="lg" />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon size={16} className="mr-2" />
          New update
        </Button>
      </Header>

      {!updates || updates.length === 0 ? (
        <EmptyState>
          <FileTextIcon size={40} strokeWidth={1.5} />
          <EmptyText>No updates yet</EmptyText>
          <EmptySubtext>
            Share news, patch notes, and announcements with your subscribers.
          </EmptySubtext>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreate(true)}
          >
            <PlusIcon size={16} className="mr-2" />
            Create your first update
          </Button>
        </EmptyState>
      ) : (
        <UpdatesList>
          {updates.map((update: any) => (
            <UpdateCard
              key={update.id}
              onClick={() => navigate(`${basePath}/updates/${update.id}`)}
            >
              <UpdateHeader>
                <UpdateTitle>{update.title}</UpdateTitle>
                <StatusBadge $status={update.status}>
                  {update.status}
                </StatusBadge>
              </UpdateHeader>
              <UpdateBody>{update.body}</UpdateBody>
              <UpdateMeta>
                <span>
                  {new Date(update.created_at).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {update.sent_count > 0 && (
                  <span>Sent to {update.sent_count} subscribers</span>
                )}
              </UpdateMeta>
            </UpdateCard>
          ))}
        </UpdatesList>
      )}

      <CreateGameUpdate
        opened={showCreate}
        setOpened={setShowCreate}
        game={game}
      />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const UpdatesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
`;

const UpdateCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s;
  font-family: inherit;
  color: inherit;

  &:hover {
    border-color: var(--border-hover);
  }
`;

const UpdateHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
`;

const UpdateTitle = styled.span`
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
`;

const StatusBadge = styled.span<{$status: string}>`
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: capitalize;
  background: ${({$status}) =>
    $status === 'published'
      ? 'color-mix(in srgb, var(--color-success-500) 15%, transparent)'
      : 'color-mix(in srgb, var(--fg-muted) 15%, transparent)'};
  color: ${({$status}) =>
    $status === 'published' ? 'var(--color-success-500)' : 'var(--fg-muted)'};
`;

const UpdateBody = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
`;

const UpdateMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  font-size: var(--text-xs);
  color: var(--fg-subtle);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 20rem;
  text-align: center;
  gap: var(--spacing-3);
  color: var(--fg-subtle);
`;

const EmptyText = styled.p`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  margin: 0;
`;

const EmptySubtext = styled.p`
  font-size: var(--text-base);
  color: var(--fg-subtle);
  margin: 0;
  max-width: 24rem;
`;
