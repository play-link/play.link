import {
  MaximizeIcon,
  MinimizeIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import {useCallback, useState} from 'react';
import {useOutletContext} from 'react-router';
import type {CreditRoleType, GameTypeType, Tables} from '@play/supabase-client';
import {GameType} from '@play/supabase-client';
import {DateTime} from 'luxon';
import styled from 'styled-components';
import {
  Button,
  Fieldset,
  Icon,
  IconButton,
  ImageInput,
  Input,
  Select,
  SingleDatePickerInput,
  Switch,
  Textarea,
  useSnackbar,
} from '@play/pylon';
import type {
  EasyCropResp,
  ImageAspectRatio,
  SingleDateValue,
} from '@play/pylon';
import {trpc} from '@/lib/trpc';
import {uploadImage} from '@/lib/upload';
import type {GameOutletContext} from '@/pages/GamePage';
import {GamePageContent} from './game-page-content';

const THEME_DEFAULTS = {
  bgColor: '#030712',
  textColor: '#ffffff',
  linkColor: '#818cf8',
};

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

const GAME_TYPE_OPTIONS: {label: string; value: GameTypeType}[] = [
  {label: 'Game', value: GameType.GAME},
  {label: 'DLC', value: GameType.DLC},
  {label: 'Demo', value: GameType.DEMO},
  {label: 'Video', value: GameType.VIDEO},
  {label: 'Mod', value: GameType.MOD},
  {label: 'Music', value: GameType.MUSIC},
  {label: 'Unknown', value: GameType.UNKNOWN},
];

const CONTROLLER_SUPPORT_OPTIONS = [
  {label: 'Not specified', value: ''},
  {label: 'None', value: 'none'},
  {label: 'Partial', value: 'partial'},
  {label: 'Full', value: 'full'},
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

interface SupportedLanguagesValue {
  raw: string | null;
  languages: string[];
}

function toTextValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function toPrettyJson(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function parseOptionalJson(input: string, label: string): unknown | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

function normalizeSupportedLanguages(value: unknown): SupportedLanguagesValue {
  if (!value) return {raw: null, languages: []};

  if (Array.isArray(value)) {
    return {
      raw: null,
      languages: value.filter(
        (item): item is string => typeof item === 'string',
      ),
    };
  }

  if (typeof value === 'object') {
    const languagesValue = (value as {languages?: unknown}).languages;
    const rawValue = (value as {raw?: unknown}).raw;
    return {
      raw: typeof rawValue === 'string' ? rawValue : null,
      languages: Array.isArray(languagesValue)
        ? languagesValue.filter(
            (item): item is string => typeof item === 'string',
          )
        : [],
    };
  }

  return {raw: typeof value === 'string' ? value : null, languages: []};
}

function parseLanguagesCsv(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function GameContent() {
  const game = useOutletContext<GameOutletContext>();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);
  const pageConfig = (primaryPage?.page_config as Record<string, any>) ?? {};
  const t = pageConfig.theme ?? {};
  const pageSlug = primaryPage?.slug ?? '';

  const {data: links = []} = trpc.gameLink.list.useQuery({gameId: game.id});
  const {data: media = []} = trpc.gameMedia.list.useQuery({gameId: game.id});

  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Status & Type
  const [status, setStatus] = useState(game.status);
  const [gameType, setGameType] = useState(
    (game.type as GameTypeType) || GameType.GAME,
  );
  const [isFree, setIsFree] = useState(Boolean(game.is_free));
  const [controllerSupport, setControllerSupport] = useState(
    (game.controller_support as string) || '',
  );
  const [releaseDate, setReleaseDate] = useState(
    (game.release_date as string) || '',
  );
  const statusDirty = status !== game.status;
  const gameTypeDirty =
    gameType !== ((game.type as GameTypeType) || GameType.GAME);
  const isFreeDirty = isFree !== Boolean(game.is_free);
  const controllerSupportDirty =
    controllerSupport !== ((game.controller_support as string) || '');
  const releaseDateDirty =
    releaseDate !== ((game.release_date as string) || '');
  const statusReleaseDirty =
    statusDirty ||
    gameTypeDirty ||
    isFreeDirty ||
    controllerSupportDirty ||
    releaseDateDirty;

  // About
  const legacyDescription = (game as {description?: unknown}).description;
  const aboutTheGameSource = game.about_the_game ?? legacyDescription;
  const [summary, setSummary] = useState((game.summary as string) || '');
  const [aboutTheGame, setAboutTheGame] = useState(() =>
    toTextValue(aboutTheGameSource),
  );
  const summaryDirty = summary !== ((game.summary as string) || '');
  const aboutTheGameDirty = aboutTheGame !== toTextValue(aboutTheGameSource);
  const aboutDirty = summaryDirty || aboutTheGameDirty;

  // Genres
  const initialGenres = Array.isArray(game.genres)
    ? (game.genres as string[])
    : [];
  const [genres, setGenres] = useState<string[]>(initialGenres);
  const genresDirty = JSON.stringify(genres) !== JSON.stringify(initialGenres);

  // Platforms
  const initialPlatforms = Array.isArray(game.platforms)
    ? (game.platforms as string[])
    : [];
  const [platforms, setPlatforms] = useState<string[]>(initialPlatforms);
  const platformsDirty =
    JSON.stringify(platforms) !== JSON.stringify(initialPlatforms);

  // Store metadata
  const initialSupportedLanguages = normalizeSupportedLanguages(
    game.supported_languages,
  );
  const [supportedLanguagesCsv, setSupportedLanguagesCsv] = useState(
    initialSupportedLanguages.languages.join(', '),
  );
  const [supportedLanguagesRaw, setSupportedLanguagesRaw] = useState(
    initialSupportedLanguages.raw ?? '',
  );
  const [pcRequirementsText, setPcRequirementsText] = useState(() =>
    toPrettyJson(game.pc_requirements),
  );
  const [macRequirementsText, setMacRequirementsText] = useState(() =>
    toPrettyJson(game.mac_requirements),
  );
  const [linuxRequirementsText, setLinuxRequirementsText] = useState(() =>
    toPrettyJson(game.linux_requirements),
  );
  const supportedLanguagesDirty =
    supportedLanguagesCsv !== initialSupportedLanguages.languages.join(', ') ||
    supportedLanguagesRaw !== (initialSupportedLanguages.raw ?? '');
  const requirementsDirty =
    pcRequirementsText !== toPrettyJson(game.pc_requirements) ||
    macRequirementsText !== toPrettyJson(game.mac_requirements) ||
    linuxRequirementsText !== toPrettyJson(game.linux_requirements);
  const storeMetadataDirty = supportedLanguagesDirty || requirementsDirty;

  const updateGame = trpc.game.update.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
      utils.game.list.invalidate();
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
    });
  };

  const handleSaveStatusRelease = () => {
    updateGame.mutate({
      id: game.id,
      status,
      type: gameType,
      isFree,
      controllerSupport: controllerSupport || null,
      releaseDate: releaseDate || null,
    });
  };

  const handleSaveAbout = () => {
    updateGame.mutate({
      id: game.id,
      summary: summary || null,
      aboutTheGame: aboutTheGame || null,
    });
  };

  const handleSaveGenres = () => {
    updateGame.mutate({
      id: game.id,
      genres,
    });
  };

  const handleSavePlatforms = () => {
    updateGame.mutate({
      id: game.id,
      platforms,
    });
  };

  const handleSaveStoreMetadata = () => {
    try {
      const pcRequirements = parseOptionalJson(
        pcRequirementsText,
        'PC requirements',
      );
      const macRequirements = parseOptionalJson(
        macRequirementsText,
        'Mac requirements',
      );
      const linuxRequirements = parseOptionalJson(
        linuxRequirementsText,
        'Linux requirements',
      );
      const supportedLanguages = {
        raw: supportedLanguagesRaw.trim() || null,
        languages: parseLanguagesCsv(supportedLanguagesCsv),
      };

      updateGame.mutate({
        id: game.id,
        supportedLanguages,
        pcRequirements,
        macRequirements,
        linuxRequirements,
      });
    } catch (error) {
      showSnackbar({
        message: error instanceof Error ? error.message : 'Invalid metadata',
        severity: 'error',
      });
    }
  };

  const handleShare = () => {
    const url = `https://play.link/${pageSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      showSnackbar({message: 'Link copied to clipboard', severity: 'success'});
    });
  };

  const previewContent = (
    <GamePageContent
      game={game}
      links={links}
      media={media}
      theme={{
        bgColor: t.bgColor || THEME_DEFAULTS.bgColor,
        textColor: t.textColor || THEME_DEFAULTS.textColor,
        linkColor: t.linkColor || THEME_DEFAULTS.linkColor,
        buttonStyle: t.buttonStyle,
        buttonRadius: t.buttonRadius,
        secondaryColor: t.secondaryColor,
        fontFamily: t.fontFamily,
      }}
    />
  );

  return (
    <>
      <Container>
        <FormColumn>
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

          {/* Cover Image */}
          <Card>
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
                    <Icon icon={XIcon} size={12} />
                  </CoverRemoveBtn>
                </CoverPreview>
              ) : (
                <ImageInput
                  aspectFn={() => 15 / 7}
                  onSubmit={handleCoverUpload}
                  inputFileProps={{
                    accept: 'image/jpeg,image/png,image/webp',
                    placeholder: coverUploading
                      ? 'Uploading...'
                      : 'Choose image',
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

          {/* Status & Type */}
          <Card>
            <SectionTitle>Status & Type</SectionTitle>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) =>
                  setStatus((e.target as HTMLSelectElement).value)
                }
              />
            </Field>
            <Field>
              <FieldLabel>Game type</FieldLabel>
              <Select
                options={GAME_TYPE_OPTIONS}
                value={gameType}
                onChange={(e) =>
                  setGameType(
                    (e.target as HTMLSelectElement).value as GameTypeType,
                  )
                }
              />
            </Field>
            <Field>
              <FieldLabel>Controller support</FieldLabel>
              <Select
                options={CONTROLLER_SUPPORT_OPTIONS}
                value={controllerSupport}
                onChange={(e) =>
                  setControllerSupport((e.target as HTMLSelectElement).value)
                }
              />
            </Field>
            <Field>
              <FieldLabel>Free to play</FieldLabel>
              <Switch
                checked={isFree}
                onChange={(e) => setIsFree(e.currentTarget.checked)}
              />
            </Field>
            <Field>
              <FieldLabel>Release date</FieldLabel>
              <SingleDatePickerInput
                value={stringToDateTime(releaseDate)}
                onChange={(date: SingleDateValue) =>
                  setReleaseDate(dateTimeToString(date))
                }
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
          <Card>
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
            <Field>
              <FieldLabel>About the game</FieldLabel>
              <Textarea
                value={aboutTheGame}
                onChange={(e) => setAboutTheGame(e.target.value)}
                placeholder="Long description shown on the public page"
                rows={8}
              />
            </Field>
            {aboutDirty && (
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAbout}
                  disabled={updateGame.isPending}
                >
                  {updateGame.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </Card>

          {/* Genres */}
          <Card>
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
          <Card>
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

          {/* Store metadata */}
          <Card>
            <SectionTitle>Store metadata</SectionTitle>
            <Hint>
              Optional Steam-like fields used for richer imports and exports.
            </Hint>
            <Field>
              <FieldLabel>Supported languages (comma separated)</FieldLabel>
              <Input
                value={supportedLanguagesCsv}
                onChange={(e) => setSupportedLanguagesCsv(e.target.value)}
                placeholder="English, Spanish, Japanese"
              />
            </Field>
            <Field>
              <FieldLabel>Supported languages raw (optional)</FieldLabel>
              <Textarea
                value={supportedLanguagesRaw}
                onChange={(e) => setSupportedLanguagesRaw(e.target.value)}
                placeholder="Raw language data from source"
                rows={3}
              />
            </Field>
            <Field>
              <FieldLabel>PC requirements (JSON)</FieldLabel>
              <Textarea
                value={pcRequirementsText}
                onChange={(e) => setPcRequirementsText(e.target.value)}
                placeholder='{"minimum":"...","recommended":"..."}'
                rows={6}
              />
            </Field>
            <Field>
              <FieldLabel>Mac requirements (JSON)</FieldLabel>
              <Textarea
                value={macRequirementsText}
                onChange={(e) => setMacRequirementsText(e.target.value)}
                placeholder='{"minimum":"...","recommended":"..."}'
                rows={6}
              />
            </Field>
            <Field>
              <FieldLabel>Linux requirements (JSON)</FieldLabel>
              <Textarea
                value={linuxRequirementsText}
                onChange={(e) => setLinuxRequirementsText(e.target.value)}
                placeholder='{"minimum":"...","recommended":"..."}'
                rows={6}
              />
            </Field>
            {storeMetadataDirty && (
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveStoreMetadata}
                  disabled={updateGame.isPending}
                >
                  {updateGame.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </Card>

          {/* Credits */}
          <Card>
            <SectionTitle>Credits</SectionTitle>
            <CreditsContent gameId={game.id} />
          </Card>
        </FormColumn>

        <PreviewColumn>
          <AddressBar>
            <AddressBarUrl>play.link/{pageSlug || '...'}</AddressBarUrl>
            <AddressBarActions>
              <IconButton
                variant="ghost"
                size="xs"
                onClick={handleShare}
                title="Copy link"
              >
                <Icon icon={ShareIcon} size={14} />
              </IconButton>
              <IconButton
                variant="ghost"
                size="xs"
                onClick={() => setIsFullscreen(true)}
                title="Fullscreen preview"
              >
                <Icon icon={MaximizeIcon} size={14} />
              </IconButton>
            </AddressBarActions>
          </AddressBar>
          <PreviewViewport>
            <PreviewFrame>
              <PreviewScroll>{previewContent}</PreviewScroll>
            </PreviewFrame>
          </PreviewViewport>
        </PreviewColumn>
      </Container>

      {isFullscreen && (
        <FullscreenOverlay>
          <FullscreenToolbar>
            <FullscreenToolbarLeft />
            <FullscreenToolbarCenter>
              <FullscreenBadge>play.link/{pageSlug || '...'}</FullscreenBadge>
            </FullscreenToolbarCenter>
            <FullscreenToolbarRight>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                title="Exit fullscreen"
              >
                <Icon icon={MinimizeIcon} size={16} />
              </IconButton>
            </FullscreenToolbarRight>
          </FullscreenToolbar>
          <FullscreenContent>{previewContent}</FullscreenContent>
        </FullscreenOverlay>
      )}
    </>
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
            <Icon icon={TrashIcon} size={12} />
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
              onChange={(e) => setNewRole(e.target.value as CreditRoleType)}
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
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </AddCreditActions>
        </AddCreditForm>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <Icon icon={PlusIcon} size={14} />
          Add credit
        </Button>
      )}
    </>
  );
}

/* ── Styles ── */

const Container = styled.div`
  display: grid;
  grid-template-columns: minmax(500px, 1fr) minmax(0, 1fr);
  gap: var(--spacing-6);
  width: 100%;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  min-width: 500px;

  @media (max-width: 1100px) {
    min-width: 0;
  }
`;

const PreviewViewport = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
`;

const PreviewColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
  position: sticky;
  top: var(--spacing-4);
  align-self: flex-start;
  height: calc(100vh - var(--spacing-8));
  max-height: calc(100vh - var(--spacing-8));
  min-width: 0;

  @media (max-width: 1100px) {
    position: static;
    height: auto;
    max-height: none;
  }
`;

const AddressBar = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-1-5) var(--spacing-4);
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
`;

const AddressBarUrl = styled.span`
  flex: 1;
  font-size: var(--text-sm);
  color: var(--fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AddressBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
`;

const PreviewFrame = styled.div`
  width: 393px;
  height: 100%;
  max-height: 600px;
  max-width: 100%;
  border-radius: var(--radius-3xl);
  border: 1px solid var(--border-muted);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  box-shadow: var(--shadow-xl);
  margin-bottom: auto;
`;

const PreviewScroll = styled.div`
  flex: 1;
  overflow-y: auto;
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

/* Fullscreen overlay styles */

const FullscreenOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: #000;
`;

const FullscreenToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-4);
  background: rgba(0, 0, 0, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  min-height: 3rem;
`;

const FullscreenToolbarLeft = styled.div`
  flex: 1;
`;

const FullscreenToolbarCenter = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const FullscreenBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
`;

const FullscreenToolbarRight = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  button {
    color: rgba(255, 255, 255, 0.7);

    &:hover {
      color: #fff;
    }
  }
`;

const FullscreenContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;
