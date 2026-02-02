import {ChevronRightIcon, ImageIcon, PlayIcon, PlusIcon, Trash2Icon, TrashIcon, VideoIcon, XIcon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {DateTime} from 'luxon';
import styled from 'styled-components';
import {Button, ColorPickerInput, Fieldset, IconButton, ImageInput, Input, Select, SingleDatePickerInput, Textarea, useSnackbar} from '@play/pylon';
import type {EasyCropResp, ImageAspectRatio, SingleDateValue} from '@play/pylon';
import type {CreditRoleType} from '@play/supabase-client';
import {uploadImage} from '@/lib/upload';
import {trpc} from '@/lib/trpc';

export interface PageConfig {
  theme?: {
    bgColor?: string;
    textColor?: string;
    linkColor?: string;
  };
}

export interface EditableLink {
  id: string;
  type: string;
  category: string;
  label: string;
  url: string;
  position: number;
}

export interface EditableMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  position: number;
}

export interface GameMetadata {
  title: string;
  summary: string;
  status: string;
  releaseDate: string;
  genres: string[];
  platforms: string[];
  coverUrl: string;
  headerUrl: string;
  trailerUrl: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?#]+)/);
  return match?.[1] ?? null;
}

const DEFAULTS = {
  bgColor: '#030712',
  textColor: '#ffffff',
  linkColor: '#818cf8',
};

const LINK_TYPE_OPTIONS = [
  {value: 'steam', label: 'Steam'},
  {value: 'itch', label: 'itch.io'},
  {value: 'epic', label: 'Epic Games'},
  {value: 'discord', label: 'Discord'},
  {value: 'youtube', label: 'YouTube'},
  {value: 'website', label: 'Website'},
  {value: 'demo', label: 'Demo'},
];

const LINK_CATEGORIES: Record<string, string> = {
  steam: 'store',
  itch: 'store',
  epic: 'store',
  discord: 'community',
  youtube: 'media',
  website: 'other',
  demo: 'other',
};

const STATUS_OPTIONS = [
  {label: 'In Development', value: 'IN_DEVELOPMENT'},
  {label: 'Upcoming', value: 'UPCOMING'},
  {label: 'Early Access', value: 'EARLY_ACCESS'},
  {label: 'Released', value: 'RELEASED'},
  {label: 'Cancelled', value: 'CANCELLED'},
];

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
  {label: 'Horror', value: 'Horror'},
  {label: 'Survival', value: 'Survival'},
  {label: 'Sandbox', value: 'Sandbox'},
  {label: 'Fighting', value: 'Fighting'},
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

const CREDIT_ROLE_OPTIONS = [
  {label: 'Developer', value: 'DEVELOPER'},
  {label: 'Publisher', value: 'PUBLISHER'},
  {label: 'Porting', value: 'PORTING'},
  {label: 'Marketing', value: 'MARKETING'},
  {label: 'Support', value: 'SUPPORT'},
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

/* ── Collapsible Section ── */

function CollapsibleSection({title, children}: {title: string; children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SectionHeader onClick={() => setOpen(!open)}>
        <SectionTitle>{title}</SectionTitle>
        <ChevronIcon $open={open}><ChevronRightIcon size={14} /></ChevronIcon>
      </SectionHeader>
      {open && <SectionContent>{children}</SectionContent>}
      <Divider />
    </>
  );
}

/* ── Asset Image Field ── */

function AssetImageField({
  label,
  value,
  onChange,
  folder,
  aspectFn,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  aspectFn?: () => number;
}) {
  const [uploading, setUploading] = useState(false);
  const {showSnackbar} = useSnackbar();

  const handleSubmit = useCallback(
    async (result: EasyCropResp & {aspectRatio: ImageAspectRatio}) => {
      setUploading(true);
      try {
        const {url} = await uploadImage(result.arrayBuffer, folder);
        onChange(url);
      } catch (error) {
        showSnackbar({
          message: error instanceof Error ? error.message : 'Upload failed',
          severity: 'error',
        });
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange, showSnackbar],
  );

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {value ? (
        <AssetPreview>
          <AssetImage src={value} alt={label} />
          <AssetRemoveBtn
            variant="ghost"
            size="xs"
            onClick={() => onChange('')}
          >
            <XIcon size={12} />
          </AssetRemoveBtn>
        </AssetPreview>
      ) : (
        <ImageInput
          aspectFn={aspectFn}
          onSubmit={handleSubmit}
          inputFileProps={{
            accept: 'image/jpeg,image/png,image/webp',
            placeholder: uploading ? 'Uploading...' : 'Choose image',
            buttonProps: {variant: 'ghost', size: 'sm', disabled: uploading},
            showSelectedFileNames: false,
            icon: <ImageIcon size={14} />,
          }}
        />
      )}
    </Field>
  );
}

/* ── Credits Section (self-contained) ── */

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
    createCredit.mutate({gameId, customName: newCustomName.trim(), role: newRole});
  };

  return (
    <>
      {credits.map((credit) => (
        <CreditRow key={credit.id}>
          <CreditInfo>
            <CreditName>{credit.studios?.name || credit.custom_name}</CreditName>
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
              onChange={(e) => setNewRole(e.target.value as CreditRoleType)}
              size="sm"
            />
          </Fieldset>
          <AddCreditActions>
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!newCustomName.trim() || createCredit.isPending}>
              Add
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </AddCreditActions>
        </AddCreditForm>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <PlusIcon size={14} className="mr-2" />
          Add credit
        </Button>
      )}
    </>
  );
}

/* ── Main Sidebar ── */

interface EditorSidebarProps {
  pageConfig: PageConfig;
  description: string;
  links: EditableLink[];
  media: EditableMedia[];
  gameMetadata: GameMetadata;
  gameId: string;
  onChange: (config: PageConfig) => void;
  onDescriptionChange: (description: string) => void;
  onLinksChange: (links: EditableLink[]) => void;
  onMediaChange: (media: EditableMedia[]) => void;
  onGameMetadataChange: (metadata: GameMetadata) => void;
}

export function EditorSidebar({
  pageConfig,
  description,
  links,
  media,
  gameMetadata,
  gameId,
  onChange,
  onDescriptionChange,
  onLinksChange,
  onMediaChange,
  onGameMetadataChange,
}: EditorSidebarProps) {
  const theme = pageConfig.theme ?? {};
  const {showSnackbar} = useSnackbar();
  const [uploading, setUploading] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const updateThemeColor = (key: keyof typeof DEFAULTS, color: string) => {
    onChange({
      ...pageConfig,
      theme: {
        ...theme,
        [key]: color,
      },
    });
  };

  const updateMetadata = (partial: Partial<GameMetadata>) => {
    onGameMetadataChange({...gameMetadata, ...partial});
  };

  const handleAddLink = () => {
    const newLink: EditableLink = {
      id: `new-${Date.now()}`,
      type: 'website',
      category: 'other',
      label: 'New link',
      url: 'https://example.com',
      position: links.length,
    };
    onLinksChange([...links, newLink]);
  };

  const handleUpdateLink = (id: string, field: string, value: string) => {
    onLinksChange(
      links.map((l) => {
        if (l.id !== id) return l;
        const updated = {...l, [field]: value};
        if (field === 'type') {
          updated.category = LINK_CATEGORIES[value] || 'other';
        }
        return updated;
      }),
    );
  };

  const handleDeleteLink = (id: string) => {
    onLinksChange(links.filter((l) => l.id !== id));
  };

  const handleImageUpload = useCallback(
    async (result: EasyCropResp & {aspectRatio: ImageAspectRatio}) => {
      setUploading(true);
      try {
        const {url} = await uploadImage(result.arrayBuffer, 'games/media');
        const newItem: EditableMedia = {
          id: `new-${Date.now()}`,
          type: 'image',
          url,
          thumbnailUrl: url,
          position: media.length,
        };
        onMediaChange([...media, newItem]);
      } catch (error) {
        showSnackbar({
          message: error instanceof Error ? error.message : 'Upload failed',
          severity: 'error',
        });
      } finally {
        setUploading(false);
      }
    },
    [media, onMediaChange, showSnackbar],
  );

  const handleAddVideo = () => {
    const ytId = getYouTubeId(videoUrl);
    if (!ytId) {
      showSnackbar({message: 'Invalid YouTube URL', severity: 'error'});
      return;
    }
    const newItem: EditableMedia = {
      id: `new-${Date.now()}`,
      type: 'video',
      url: videoUrl,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
      position: media.length,
    };
    onMediaChange([...media, newItem]);
    setVideoUrl('');
    setShowVideoInput(false);
  };

  const handleDeleteMedia = (id: string) => {
    onMediaChange(media.filter((m) => m.id !== id));
  };

  return (
    <Container>
      {/* General */}
      <CollapsibleSection title="General">
        <Field>
          <FieldLabel>Title</FieldLabel>
          <Input
            value={gameMetadata.title}
            onChange={(e) => updateMetadata({title: e.target.value})}
            placeholder="Game title"
          />
        </Field>
        <Field>
          <FieldLabel>Summary</FieldLabel>
          <Textarea
            value={gameMetadata.summary}
            onChange={(e) => updateMetadata({summary: e.target.value})}
            placeholder="A short description of your game"
            rows={3}
          />
        </Field>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Tell visitors about your game..."
            rows={6}
          />
        </Field>
      </CollapsibleSection>

      {/* Status & Release */}
      <CollapsibleSection title="Status & Release">
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select
            options={STATUS_OPTIONS}
            value={gameMetadata.status}
            onChange={(e) => updateMetadata({status: (e.target as HTMLSelectElement).value})}
          />
        </Field>
        <Field>
          <FieldLabel>Release date</FieldLabel>
          <SingleDatePickerInput
            value={stringToDateTime(gameMetadata.releaseDate)}
            onChange={(date) => updateMetadata({releaseDate: dateTimeToString(date)})}
            placeholder="Select release date"
            fullWidth
          />
        </Field>
      </CollapsibleSection>

      {/* Genres & Platforms */}
      <CollapsibleSection title="Genres & Platforms">
        <Field>
          <FieldLabel>Genres</FieldLabel>
          <Select
            options={GENRE_OPTIONS}
            value={gameMetadata.genres}
            onChange={(e) => updateMetadata({genres: (e.target as unknown as HTMLSelectElement).value as unknown as string[]})}
            multiple
            searchable
            placeholder="Select genres..."
          />
        </Field>
        <Field>
          <FieldLabel>Platforms</FieldLabel>
          <Select
            options={PLATFORM_OPTIONS}
            value={gameMetadata.platforms}
            onChange={(e) => updateMetadata({platforms: (e.target as unknown as HTMLSelectElement).value as unknown as string[]})}
            multiple
            placeholder="Select platforms..."
          />
        </Field>
      </CollapsibleSection>

      {/* Theme */}
      <CollapsibleSection title="Theme">
        <Field>
          <FieldLabel>Background</FieldLabel>
          <ColorPickerInput
            value={theme.bgColor || DEFAULTS.bgColor}
            onChange={(c) => updateThemeColor('bgColor', c)}
          />
        </Field>
        <Field>
          <FieldLabel>Text</FieldLabel>
          <ColorPickerInput
            value={theme.textColor || DEFAULTS.textColor}
            onChange={(c) => updateThemeColor('textColor', c)}
          />
        </Field>
        <Field>
          <FieldLabel>Links</FieldLabel>
          <ColorPickerInput
            value={theme.linkColor || DEFAULTS.linkColor}
            onChange={(c) => updateThemeColor('linkColor', c)}
          />
        </Field>
      </CollapsibleSection>

      {/* Assets */}
      <CollapsibleSection title="Assets">
        <AssetHint>Source images used across listings, embeds, and previews.</AssetHint>
        <AssetImageField
          label="Cover image"
          value={gameMetadata.coverUrl}
          onChange={(url) => updateMetadata({coverUrl: url})}
          folder="games/covers"
          aspectFn={() => 16 / 9}
        />
        <AssetImageField
          label="Header image"
          value={gameMetadata.headerUrl}
          onChange={(url) => updateMetadata({headerUrl: url})}
          folder="games/headers"
          aspectFn={() => 3 / 1}
        />
        <Field>
          <FieldLabel>Trailer URL</FieldLabel>
          <Input
            value={gameMetadata.trailerUrl}
            onChange={(e) => updateMetadata({trailerUrl: e.target.value})}
            placeholder="https://youtube.com/watch?v=..."
          />
        </Field>
      </CollapsibleSection>

      {/* Media (page gallery) */}
      <CollapsibleSection title="Media">
        {media.length > 0 && (
          <MediaGrid>
            {media.map((item) => (
              <MediaThumb key={item.id}>
                <img src={item.thumbnailUrl} alt="" />
                {item.type === 'video' && (
                  <VideoOverlay>
                    <PlayIcon size={16} />
                  </VideoOverlay>
                )}
                <MediaDeleteBtn
                  variant="ghost"
                  size="xs"
                  onClick={() => handleDeleteMedia(item.id)}
                >
                  <XIcon size={12} />
                </MediaDeleteBtn>
              </MediaThumb>
            ))}
          </MediaGrid>
        )}
        {showVideoInput && (
          <VideoInputRow>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              size="sm"
            />
            <Button variant="primary" size="sm" onClick={handleAddVideo}>
              Add
            </Button>
            <IconButton variant="ghost" size="sm" onClick={() => {
              setShowVideoInput(false);
              setVideoUrl('');
            }}>
              <XIcon size={14} />
            </IconButton>
          </VideoInputRow>
        )}
        <MediaActions>
          <ImageInput
            aspectFn={() => 16 / 9}
            onSubmit={handleImageUpload}
            inputFileProps={{
              accept: 'image/jpeg,image/png,image/webp',
              placeholder: uploading ? 'Uploading...' : 'Add image',
              buttonProps: {
                variant: 'ghost',
                size: 'sm',
                disabled: uploading,
              },
              showSelectedFileNames: false,
              icon: <ImageIcon size={14} />,
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVideoInput(true)}
          >
            <VideoIcon size={14} className="mr-2" />
            Add video
          </Button>
        </MediaActions>
      </CollapsibleSection>

      {/* Links */}
      <CollapsibleSection title="Links">
        {links.map((link) => (
          <LinkEntry key={link.id}>
            <LinkEntryHeader>
              <Select
                size="sm"
                fullWidth
                value={link.type}
                options={LINK_TYPE_OPTIONS}
                onChange={(e) => handleUpdateLink(link.id, 'type', (e.target as HTMLSelectElement).value as string)}
              />
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteLink(link.id)}
              >
                <Trash2Icon size={14} />
              </IconButton>
            </LinkEntryHeader>
            <Input
              value={link.label}
              onChange={(e) => handleUpdateLink(link.id, 'label', e.target.value)}
              placeholder="Label"
            />
            <Input
              value={link.url}
              onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
              placeholder="https://..."
            />
          </LinkEntry>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddLink}
        >
          <PlusIcon size={14} className="mr-2" />
          Add link
        </Button>
      </CollapsibleSection>

      {/* Credits */}
      <CollapsibleSection title="Credits">
        <CreditsContent gameId={gameId} />
      </CollapsibleSection>
    </Container>
  );
}

/* ── Styles ── */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
`;

const SectionHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background-color 0.15s;

  &:hover {
    background: var(--bg-hover);
  }
`;

const SectionTitle = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ChevronIcon = styled.span<{$open: boolean}>`
  display: inline-flex;
  color: var(--fg-muted);
  transition: transform 0.15s;
  transform: rotate(${(p) => (p.$open ? '90deg' : '0deg')});
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: 0 var(--spacing-4) var(--spacing-4);
`;

const Divider = styled.div`
  height: 1px;
  background: var(--border-muted);
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

const AssetHint = styled.p`
  font-size: var(--text-xs);
  color: var(--fg-muted);
  margin: 0;
`;

const AssetPreview = styled.div`
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-muted);
`;

const AssetImage = styled.img`
  width: 100%;
  display: block;
  object-fit: cover;
  max-height: 8rem;
`;

const AssetRemoveBtn = styled(IconButton)`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 9999px;
  width: 20px;
  height: 20px;
  padding: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const LinkEntry = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--bg-muted);
  border-radius: var(--radius-md);
`;

const LinkEntryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2);
`;

const MediaThumb = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  pointer-events: none;
`;

const MediaDeleteBtn = styled(IconButton)`
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 9999px;
  width: 20px;
  height: 20px;
  padding: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const VideoInputRow = styled.div`
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
`;

const MediaActions = styled.div`
  display: flex;
  gap: var(--spacing-2);
`;

/* ── Credits ── */

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
