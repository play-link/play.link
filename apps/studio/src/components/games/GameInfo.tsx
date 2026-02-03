import {PlusIcon, TrashIcon, XIcon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {DateTime} from 'luxon';
import {useOutletContext} from 'react-router';
import styled from 'styled-components';
import type {CreditRoleType,Tables} from '@play/supabase-client';
import {Button, Fieldset, IconButton, ImageInput, Input, Select, SingleDatePickerInput, Textarea, useSnackbar} from '@play/pylon';
import type {EasyCropResp, ImageAspectRatio, SingleDateValue} from '@play/pylon';
import {trpc} from '@/lib/trpc';
import {uploadImage} from '@/lib/upload';
import type {GameOutletContext} from '@/pages/GamePage';

const GENRE_OPTIONS = [
  {label: 'Action', value: 'Action'},
  {label: 'Adventure', value: 'Adventure'},
  {label: 'RPG', value: 'RPG'},
  {label: 'Strategy', value: 'Strategy'},
  {label: 'Simulation', value: 'Simulation'},
  {label: 'Puzzle', value: 'Puzzle'},
  {label: 'Platformer', value: 'Platformer'},
  {label: 'Shooter', value: 'Shooter'},
  {label: 'Racing', value: 'Racing'},
  {label: 'Sports', value: 'Sports'},
  {label: 'Fighting', value: 'Fighting'},
  {label: 'Horror', value: 'Horror'},
  {label: 'Survival', value: 'Survival'},
  {label: 'Sandbox', value: 'Sandbox'},
  {label: 'Open World', value: 'Open World'},
  {label: 'Roguelike', value: 'Roguelike'},
  {label: 'Visual Novel', value: 'Visual Novel'},
  {label: 'Metroidvania', value: 'Metroidvania'},
  {label: 'Card Game', value: 'Card Game'},
  {label: 'Tower Defense', value: 'Tower Defense'},
  {label: 'Indie', value: 'Indie'},
];

const PLATFORM_OPTIONS = [
  {label: 'PC', value: 'PC'},
  {label: 'Mac', value: 'Mac'},
  {label: 'Linux', value: 'Linux'},
  {label: 'PS5', value: 'PS5'},
  {label: 'Xbox Series', value: 'Xbox Series'},
  {label: 'Switch', value: 'Switch'},
  {label: 'iOS', value: 'iOS'},
  {label: 'Android', value: 'Android'},
];

const STATUS_OPTIONS = [
  {label: 'In Development', value: 'IN_DEVELOPMENT'},
  {label: 'Upcoming', value: 'UPCOMING'},
  {label: 'Early Access', value: 'EARLY_ACCESS'},
  {label: 'Released', value: 'RELEASED'},
  {label: 'Cancelled', value: 'CANCELLED'},
];

function stringToDateTime(value: string): SingleDateValue {
  if (!value) return undefined;
  const dt = DateTime.fromISO(value);
  return dt.isValid ? dt : undefined;
}

function dateTimeToString(value: SingleDateValue): string {
  if (!value) return '';
  return value.toISODate() ?? '';
}

const CREDIT_ROLE_OPTIONS: {label: string; value: CreditRoleType}[] = [
  {label: 'Developer', value: 'DEVELOPER'},
  {label: 'Publisher', value: 'PUBLISHER'},
  {label: 'Porting', value: 'PORTING'},
  {label: 'Marketing', value: 'MARKETING'},
  {label: 'Support', value: 'SUPPORT'},
];

const SECTIONS = [
  {id: 'identity', label: 'Identity'},
  {id: 'cover', label: 'Cover Image'},
  {id: 'status', label: 'Status & Release'},
  {id: 'about', label: 'About'},
  {id: 'genres', label: 'Genres'},
  {id: 'platforms', label: 'Platforms'},
  {id: 'player-modes', label: 'Player Modes'},
  {id: 'credits', label: 'Credits'},
  {id: 'languages', label: 'Languages'},
  {id: 'age-rating', label: 'Age Rating'},
] as const;

function useSectionNav(initialId: string) {
  const [activeId, setActiveId] = useState(initialId);

  const scrollTo = useCallback((id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
  }, []);

  return {activeId, scrollTo};
}

export function GameInfo() {
  const game = useOutletContext<GameOutletContext>();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();

  const {activeId, scrollTo} = useSectionNav(SECTIONS[0].id);

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);

  // Identity
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

  // Status & Release
  const [status, setStatus] = useState(game.status);
  const [releaseDate, setReleaseDate] = useState((game.release_date as string) || '');
  const statusDirty = status !== game.status;
  const releaseDateDirty = releaseDate !== ((game.release_date as string) || '');
  const statusReleaseDirty = statusDirty || releaseDateDirty;

  // Summary
  const [summary, setSummary] = useState((game.summary as string) || '');
  const summaryDirty = summary !== ((game.summary as string) || '');

  // Genres
  const initialGenres = Array.isArray(game.genres) ? (game.genres as string[]) : [];
  const [genres, setGenres] = useState<string[]>(initialGenres);
  const genresDirty = JSON.stringify(genres) !== JSON.stringify(initialGenres);

  // Platforms
  const initialPlatforms = Array.isArray(game.platforms)
    ? (game.platforms as string[])
    : [];
  const [platforms, setPlatforms] = useState<string[]>(initialPlatforms);
  const platformsDirty =
    JSON.stringify(platforms) !== JSON.stringify(initialPlatforms);

  const updateGame = trpc.game.update.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
      showSnackbar({message: 'Saved', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  // Cover image
  const [coverUrl, setCoverUrl] = useState((game.cover_url as string) || '');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverDirty = coverUrl !== ((game.cover_url as string) || '');

  const handleCoverUpload = useCallback(
    async (result: EasyCropResp & {aspectRatio: ImageAspectRatio}) => {
      setCoverUploading(true);
      try {
        const {url} = await uploadImage(result.arrayBuffer, 'games/covers');
        setCoverUrl(url);
      } catch (error) {
        showSnackbar({
          message: error instanceof Error ? error.message : 'Upload failed',
          severity: 'error',
        });
      } finally {
        setCoverUploading(false);
      }
    },
    [showSnackbar],
  );

  const handleSaveCover = () => {
    updateGame.mutate({
      id: game.id,
      coverUrl: coverUrl || null,
    } as any);
  };

  const handleSaveStatusRelease = () => {
    updateGame.mutate({
      id: game.id,
      status: status as any,
      releaseDate: releaseDate || null,
    } as any);
  };

  const handleSaveSummary = () => {
    updateGame.mutate({
      id: game.id,
      summary: summary || null,
    } as any);
  };

  const handleSaveGenres = () => {
    updateGame.mutate({
      id: game.id,
      genres,
    } as any);
  };

  const handleSavePlatforms = () => {
    updateGame.mutate({
      id: game.id,
      platforms: platforms as any,
    } as any);
  };

  return (
    <Container>
      <SideNav>
        {SECTIONS.map((section) => (
          <Button
            key={section.id}
            variant="nav"
            size="sm"
            className={activeId === section.id ? 'active' : ''}
            onClick={() => scrollTo(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </SideNav>
      <Sections>
        {/* Identity */}
        <Card id="identity">
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

        {/* Cover Image */}
        <Card id="cover">
          <SectionTitle>Cover Image</SectionTitle>
          <Hint>Used for embeds, social previews, and listings.</Hint>
          <Field>
            {coverUrl ? (
              <CoverPreview>
                <CoverImage src={coverUrl} alt="Cover" />
                <CoverRemoveBtn
                  variant="ghost"
                  size="xs"
                  onClick={() => setCoverUrl('')}
                >
                  <XIcon size={12} />
                </CoverRemoveBtn>
              </CoverPreview>
            ) : (
              <ImageInput
                aspectFn={() => 16 / 9}
                onSubmit={handleCoverUpload}
                inputFileProps={{
                  accept: 'image/jpeg,image/png,image/webp',
                  placeholder: coverUploading ? 'Uploading...' : 'Choose image',
                }}
              />
            )}
          </Field>
          {coverDirty && (
            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCover}
                disabled={updateGame.isPending}
              >
                {updateGame.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </Card>

        {/* Status & Release */}
        <Card id="status">
          <SectionTitle>Status & Release</SectionTitle>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus((e.target as HTMLSelectElement).value)}
            />
          </Field>
          <Field>
            <FieldLabel>Release date</FieldLabel>
            <SingleDatePickerInput
              value={stringToDateTime(releaseDate)}
              onChange={(date: SingleDateValue) => setReleaseDate(dateTimeToString(date))}
              placeholder="Select release date"
              fullWidth
            />
          </Field>
          {statusReleaseDirty && (
            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveStatusRelease}
                disabled={updateGame.isPending}
              >
                {updateGame.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </Card>

        {/* About */}
        <Card id="about">
          <SectionTitle>About</SectionTitle>
          <Field>
            <FieldLabel>Summary</FieldLabel>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A short description of your game"
              rows={3}
            />
          </Field>
          {summaryDirty && (
            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSummary}
                disabled={updateGame.isPending}
              >
                {updateGame.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </Card>

        {/* Genres */}
        <Card id="genres">
          <SectionTitle>Genres</SectionTitle>
          <Field>
            <Select
              options={GENRE_OPTIONS}
              value={genres}
              onChange={(e) =>
                setGenres(
                  (e.target as unknown as HTMLSelectElement)
                    .value as unknown as string[],
                )
              }
              multiple
              searchable
              placeholder="Select genres..."
            />
          </Field>
          {genresDirty && (
            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveGenres}
                disabled={updateGame.isPending}
              >
                {updateGame.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </Card>

        {/* Platforms */}
        <Card id="platforms">
          <SectionTitle>Platforms</SectionTitle>
          <Field>
            <FieldLabel>Available on</FieldLabel>
            <Select
              options={PLATFORM_OPTIONS}
              value={platforms}
              onChange={(e) =>
                setPlatforms(
                  (e.target as unknown as HTMLSelectElement)
                    .value as unknown as string[],
                )
              }
              multiple
              searchable
              placeholder="Select platforms..."
            />
          </Field>
          {platformsDirty && (
            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePlatforms}
                disabled={updateGame.isPending}
              >
                {updateGame.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </Card>

        {/* Player Modes */}
        <Card id="player-modes">
          <SectionTitle>Player Modes</SectionTitle>
          <Muted>Coming soon</Muted>
        </Card>

        {/* Credits */}
        <Card id="credits">
          <SectionTitle>Credits</SectionTitle>
          <CreditsContent gameId={game.id} />
        </Card>

        {/* Languages */}
        <Card id="languages">
          <SectionTitle>Languages</SectionTitle>
          <Muted>Coming soon</Muted>
        </Card>

        {/* Age Rating */}
        <Card id="age-rating">
          <SectionTitle>Age Rating</SectionTitle>
          <Muted>Coming soon</Muted>
        </Card>
      </Sections>
    </Container>
  );
}

/* ── Credits (self-contained) ── */

function CreditsContent({gameId}: {gameId: string}) {
  const {showSnackbar} = useSnackbar();
  const [adding, setAdding] = useState(false);
  const [newRole, setNewRole] = useState<CreditRoleType>('DEVELOPER');
  const [newCustomName, setNewCustomName] = useState('');

  const utils = trpc.useUtils();
  const {data: credits = []} = trpc.gameCredit.list.useQuery({gameId});

  const createCredit = trpc.gameCredit.create.useMutation({
    onSuccess: () => {
      utils.gameCredit.list.invalidate({gameId});
      setAdding(false);
      setNewCustomName('');
      setNewRole('DEVELOPER');
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const deleteCredit = trpc.gameCredit.delete.useMutation({
    onSuccess: () => {
      utils.gameCredit.list.invalidate({gameId});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleAdd = () => {
    if (!newCustomName.trim()) return;
    createCredit.mutate({
      gameId,
      customName: newCustomName.trim(),
      role: newRole,
    });
  };

  return (
    <>
      {credits.map((credit) => (
        <CreditRow key={credit.id}>
          <CreditInfo>
            <CreditName>
              {credit.studios?.name || credit.custom_name}
            </CreditName>
            <CreditRoleBadge>{credit.role.toLowerCase()}</CreditRoleBadge>
          </CreditInfo>
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => deleteCredit.mutate({id: credit.id})}
            disabled={deleteCredit.isPending}
          >
            <TrashIcon size={12} />
          </IconButton>
        </CreditRow>
      ))}
      {adding ? (
        <AddCreditForm>
          <Fieldset label="Name">
            <Input
              value={newCustomName}
              onChange={(e) => setNewCustomName(e.target.value)}
              placeholder="Studio or person name"
              size="sm"
            />
          </Fieldset>
          <Fieldset label="Role">
            <Select
              options={CREDIT_ROLE_OPTIONS}
              value={newRole}
              onChange={(e) =>
                setNewRole(e.target.value as CreditRoleType)
              }
              size="sm"
            />
          </Fieldset>
          <AddCreditActions>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={!newCustomName.trim() || createCredit.isPending}
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </AddCreditActions>
        </AddCreditForm>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding(true)}
        >
          <PlusIcon size={14} />
          Add credit
        </Button>
      )}
    </>
  );
}

/* ── Styles ── */

const Container = styled.div`
  display: flex;
  gap: var(--spacing-6);
  width: 100%;
`;

const SideNav = styled.nav`
  position: sticky;
  top: var(--spacing-8);
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 10rem;
  flex-shrink: 0;
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  flex: 1;
  min-width: 0;
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

/* Cover image styles */

const CoverPreview = styled.div`
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-muted);
`;

const CoverImage = styled.img`
  width: 100%;
  display: block;
  object-fit: cover;
  max-height: 12rem;
`;

const CoverRemoveBtn = styled(IconButton)`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 9999px;
  width: 20px;
  height: 20px;
  padding: 0;
`;

/* Credits styles */

const CreditRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-muted);
  border-radius: var(--radius-md);
`;

const CreditInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const CreditName = styled.span`
  font-size: var(--text-sm);
  color: var(--fg);
  font-weight: var(--font-weight-medium);
`;

const CreditRoleBadge = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
  background: var(--bg-surface);
  padding: var(--spacing-0-5) var(--spacing-2);
  border-radius: var(--radius-md);
`;

const AddCreditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--bg-muted);
  border-radius: var(--radius-md);
`;

const AddCreditActions = styled.div`
  display: flex;
  gap: var(--spacing-2);
`;
