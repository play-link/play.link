import {useEffect} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {useOutletContext} from 'react-router';
import type {AppRouter} from '@play/api/trpc';
import type {inferRouterOutputs} from '@trpc/server';
import styled from 'styled-components';
import {Button, useSnackbar} from '@play/pylon';
import {trpc} from '@/lib/trpc';
import type {GameOutletContext} from '@/pages/GamePage';
import {BasicInfoSection} from './BasicInfoSection';
import {CreditsSection} from './CreditsSection';
import {DangerZoneSection} from './DangerZoneSection';
import {GenresSection} from './GenresSection';
import {IdentitySection} from './IdentitySection';
import {MediaAssetsSection} from './MediaAssetsSection';
import {OwnershipSection} from './OwnershipSection';
import {PlatformsSection} from './PlatformsSection';
import {StatusReleaseSection} from './StatusReleaseSection';
import type {GameSettingsFormValues} from './types';

type Game = inferRouterOutputs<AppRouter>['game']['get'];

function gameToFormValues(game: Game): GameSettingsFormValues {
  return {
    title: game.title,
    slug: game.slug,
    summary: game.summary || '',
    description:
      typeof game.description === 'string'
        ? game.description
        : game.description
          ? JSON.stringify(game.description)
          : '',
    status: game.status,
    releaseDate: game.release_date || '',
    genres: game.genres || [],
    platforms: Array.isArray(game.platforms)
      ? (game.platforms as string[])
      : [],
    coverUrl: game.cover_url || '',
    headerUrl: game.header_url || '',
    trailerUrl: game.trailer_url || '',
  };
}

export function GameSettings() {
  const game = useOutletContext<GameOutletContext>();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();

  const methods = useForm<GameSettingsFormValues>({
    defaultValues: gameToFormValues(game),
  });

  const {
    handleSubmit,
    reset,
    formState: {isDirty, isSubmitting},
  } = methods;

  // Reset form when game data changes (e.g. after refetch)
  useEffect(() => {
    reset(gameToFormValues(game));
  }, [game, reset]);

  const updateGame = trpc.game.update.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
      showSnackbar({message: 'Settings saved', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const onSubmit = (values: GameSettingsFormValues) => {
    updateGame.mutate({
      id: game.id,
      title: values.title,
      slug: values.slug,
      summary: values.summary || null,
      description: values.description || null,
      status: values.status,
      releaseDate: values.releaseDate || null,
      genres: values.genres,
      platforms: values.platforms,
      coverUrl: values.coverUrl || null,
      headerUrl: values.headerUrl || null,
      trailerUrl: values.trailerUrl || null,
    });
  };

  const saving = isSubmitting || updateGame.isPending;

  return (
    <FormProvider {...methods}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <StickyHeader>
          <HeaderTitle>Game Settings</HeaderTitle>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!isDirty || saving}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </StickyHeader>

        <Sections>
          <Card>
            <IdentitySection disabled={saving} />
          </Card>
          <Card>
            <BasicInfoSection disabled={saving} />
          </Card>
          <Card>
            <StatusReleaseSection disabled={saving} />
          </Card>
          <Card>
            <GenresSection disabled={saving} />
          </Card>
          <Card>
            <PlatformsSection disabled={saving} />
          </Card>
          <Card>
            <MediaAssetsSection disabled={saving} />
          </Card>
          <Card>
            <CreditsSection gameId={game.id} />
          </Card>
          <Card>
            <OwnershipSection />
          </Card>
          <DangerZoneSection gameId={game.id} gameTitle={game.title} />
        </Sections>
      </Form>
    </FormProvider>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) 0;
`;

const HeaderTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const Card = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
`;
