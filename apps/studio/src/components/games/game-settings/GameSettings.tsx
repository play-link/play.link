import {useState} from 'react';
import {useOutletContext} from 'react-router';
import type {Tables} from '@play/supabase-client';
import styled from 'styled-components';
import {Button, Input, useSnackbar} from '@play/pylon';
import {trpc} from '@/lib/trpc';
import type {GameOutletContext} from '@/pages/GamePage';
import {DangerZoneSection} from './DangerZoneSection';
import {RedirectSection} from './RedirectSection';

export function GameSettings() {
  const game = useOutletContext<GameOutletContext>();
  const {showSnackbar} = useSnackbar();

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);

  // Identity fields
  const [title, setTitle] = useState(game.title);
  const [slug, setSlug] = useState(primaryPage?.slug ?? '');
  const titleDirty = title !== game.title;
  const slugDirty = primaryPage ? slug !== primaryPage.slug : false;
  const identityDirty = titleDirty || slugDirty;

  const createChangeRequest = trpc.changeRequest.create.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Change request submitted', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleRequestChange = () => {
    if (titleDirty && title.trim()) {
      createChangeRequest.mutate({
        entityType: 'game',
        entityId: game.id,
        fieldName: 'name',
        requestedValue: title.trim(),
      });
    }
    if (slugDirty && slug.trim() && primaryPage) {
      createChangeRequest.mutate({
        entityType: 'game_page',
        entityId: primaryPage.id,
        fieldName: 'slug',
        requestedValue: slug.trim(),
      });
    }
  };

  return (
    <Container>
      <Sections>
        {/* Identity */}
        <Card>
          <SectionTitle>Identity</SectionTitle>
          <Hint>Changes to game name and URL require approval.</Hint>
          <Field>
            <FieldLabel>Game Title</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Game title"
            />
          </Field>
          <Field>
            <FieldLabel>Slug / URL</FieldLabel>
            {primaryPage ? (
              <SlugInputRow>
                <SlugPrefix>play.link/</SlugPrefix>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="your-game"
                />
              </SlugInputRow>
            ) : (
              <Muted>No page configured</Muted>
            )}
          </Field>
          {identityDirty && (
            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestChange}
                disabled={createChangeRequest.isPending}
              >
                {createChangeRequest.isPending
                  ? 'Submitting...'
                  : 'Request Change'}
              </Button>
            </div>
          )}
        </Card>

        {/* Redirect */}
        <Card>
          <RedirectSection />
        </Card>

        {/* Delete */}
        <DangerZoneSection gameId={game.id} gameTitle={game.title} />
      </Sections>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: 100%;
  max-width: var(--container-2xl);
`;

const Card = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const SectionTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const Hint = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-subtle);
  margin: 0;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const FieldLabel = styled.label`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;

const SlugInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
`;

const SlugPrefix = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  white-space: nowrap;
`;

const Muted = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
`;
