import {PlusIcon} from 'lucide-react';
import styled from 'styled-components';
import {Button, Icon} from '@play/pylon';
import type {GamesVisibilityFilter} from './types';

interface GamesPageEmptyStateProps {
  visibilityFilter: GamesVisibilityFilter;
  draftCount: number;
  publishedCount: number;
  onCreateGame: () => void;
  onChangeVisibilityFilter: (filter: GamesVisibilityFilter) => void;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function GamesPageEmptyState({
  visibilityFilter,
  draftCount,
  publishedCount,
  onCreateGame,
  onChangeVisibilityFilter,
}: GamesPageEmptyStateProps) {
  if (visibilityFilter === 'published' && draftCount > 0) {
    return (
      <EmptyState>
        <EmptyTitle>No published games</EmptyTitle>
        <EmptyText>
          You have {draftCount} {pluralize(draftCount, 'draft', 'drafts')}.
          Publish one to see it here.
        </EmptyText>
        <Actions>
          <Button
            variant="outline"
            onClick={() => onChangeVisibilityFilter('draft')}
          >
            View drafts
          </Button>
        </Actions>
      </EmptyState>
    );
  }

  if (visibilityFilter === 'draft' && publishedCount > 0) {
    return (
      <EmptyState>
        <EmptyTitle>No draft games</EmptyTitle>
        <EmptyText>
          You have {publishedCount}{' '}
          {pluralize(publishedCount, 'published game', 'published games')}.
          Create a new draft to keep building.
        </EmptyText>
        <Actions>
          <Button
            variant="outline"
            onClick={() => onChangeVisibilityFilter('published')}
          >
            View published
          </Button>
        </Actions>
      </EmptyState>
    );
  }

  return (
    <EmptyState>
      <EmptyTitle>No games yet</EmptyTitle>
      <EmptyText>
        Create your first game to start building your play.link page.
      </EmptyText>
      <Button variant="primary" onClick={onCreateGame}>
        <Icon icon={PlusIcon} size={16} className="mr-2" />
        Create your first game
      </Button>
    </EmptyState>
  );
}

const Actions = styled.div`
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  justify-content: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-16) var(--spacing-6);
  background: var(--bg-surface);
  border: 1.5px dashed var(--border-muted);
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
