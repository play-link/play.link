import {ChevronRightIcon, FileTextIcon, GalleryHorizontalEndIcon, GamepadIcon, ImageIcon, LinkIcon, PaletteIcon, PlayIcon, PlusIcon, SwatchBookIcon, Trash2Icon, VideoIcon, XIcon} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';
import {Button, ColorPickerInput, IconButton, ImageInput, Input, Select, Textarea, useSnackbar} from '@play/pylon';
import type {EasyCropResp, ImageAspectRatio} from '@play/pylon';
import {uploadImage} from '@/lib/upload';
import type {EditableLink, EditableMedia, GameMetadata, PageConfig} from './types';

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

const PLATFORM_LINK_TYPE_OPTIONS = [
  {label: 'Steam', value: 'steam'},
  {label: 'itch.io', value: 'itch'},
  {label: 'Epic Games', value: 'epic'},
  {label: 'Nintendo Switch', value: 'nintendo-switch'},
  {label: 'PlayStation', value: 'playstation'},
  {label: 'Xbox', value: 'xbox'},
  {label: 'App Store', value: 'app-store'},
  {label: 'Google Play', value: 'google-play'},
];

const FONT_OPTIONS = [
  // Sci-fi / Tech
  {value: 'Space Grotesk', label: 'Space Grotesk'},
  {value: 'Oxanium', label: 'Oxanium'},
  {value: 'Orbitron', label: 'Orbitron'},
  {value: 'Exo 2', label: 'Exo 2'},
  // Bold / Display
  {value: 'Bebas Neue', label: 'Bebas Neue'},
  {value: 'Anton', label: 'Anton'},
  {value: 'Teko', label: 'Teko'},
  {value: 'Archivo Black', label: 'Archivo Black'},
  // Rounded / Friendly
  {value: 'Nunito', label: 'Nunito'},
  {value: 'Rubik', label: 'Rubik'},
  {value: 'Baloo 2', label: 'Baloo 2'},
  // Geometric
  {value: 'Outfit', label: 'Outfit'},
  {value: 'Sora', label: 'Sora'},
  {value: 'Syne', label: 'Syne'},
  {value: 'Chakra Petch', label: 'Chakra Petch'},
];

const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${FONT_OPTIONS.map(
  (f) => `family=${f.value.replace(/ /g, '+')}:wght@400;600;700`,
).join('&')}&display=swap`;

const PLATFORM_LINK_LABELS: Record<string, string> = Object.fromEntries(
  PLATFORM_LINK_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

/* ── Collapsible Section ── */

function CollapsibleSection({title, icon: Icon, children}: {title: string; icon: LucideIcon; children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SectionHeader onClick={() => setOpen(!open)}>
        <SectionTitleRow>
          <Icon size={16} strokeWidth={2} />
          <SectionTitle>{title}</SectionTitle>
        </SectionTitleRow>
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

/* ── Main Sidebar ── */

interface EditorSidebarProps {
  pageConfig: PageConfig;
  description: string;
  links: EditableLink[];
  media: EditableMedia[];
  gameMetadata: GameMetadata;
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
  // Load all Google Fonts eagerly so they're ready when selected
  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    const id = 'editor-google-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = GOOGLE_FONTS_URL;
      link.onload = () => {
        document.fonts.ready.then(() => setFontsLoaded(true));
      };
      document.head.appendChild(link);
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  const updateThemeColor = (key: string, color: string) => {
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

  // Platform links (category='platform') stored in game_links
  const platformLinks = links.filter((l) => l.category === 'platform');
  const nonPlatformLinks = links.filter((l) => l.category !== 'platform');

  const handleAddPlatformLink = () => {
    const newLink: EditableLink = {
      id: `new-${Date.now()}`,
      type: 'steam',
      category: 'platform',
      label: PLATFORM_LINK_LABELS.steam || 'Steam',
      url: '',
      position: links.length,
      comingSoon: false,
    };
    onLinksChange([...links, newLink]);
  };

  const handleUpdatePlatformLink = (id: string, field: string, value: string | boolean) => {
    onLinksChange(
      links.map((l) => {
        if (l.id !== id) return l;
        const updated = {...l, [field]: value};
        if (field === 'type') {
          updated.label = PLATFORM_LINK_LABELS[value as string] || (value as string);
        }
        return updated;
      }),
    );
  };

  const handleDeletePlatformLink = (id: string) => {
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
      {/* Description */}
      <CollapsibleSection title="Description" icon={FileTextIcon}>
        <Field>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Tell visitors about your game..."
            rows={6}
          />
        </Field>
      </CollapsibleSection>

      {/* Theme */}
      <CollapsibleSection title="Theme" icon={PaletteIcon}>
        <ColorRow>
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
            <FieldLabel>Secondary</FieldLabel>
            <ColorPickerInput
              value={theme.secondaryColor || DEFAULTS.textColor}
              onChange={(c) => updateThemeColor('secondaryColor', c)}
            />
          </Field>
        </ColorRow>
        <Field>
          <FieldLabel>Button style</FieldLabel>
          <SegmentedControl>
            {(['glass', 'solid', 'outline'] as const).map((style) => (
              <SegmentedOption
                key={style}
                $active={( theme.buttonStyle || 'glass') === style}
                onClick={() => onChange({...pageConfig, theme: {...theme, buttonStyle: style}})}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </SegmentedOption>
            ))}
          </SegmentedControl>
        </Field>
        <Field>
          <FieldLabel>Button corners</FieldLabel>
          <SegmentedControl>
            {([
              {value: 'sm', label: 'Sharp'},
              {value: 'md', label: 'Round'},
              {value: 'lg', label: 'Rounder'},
              {value: 'full', label: 'Pill'},
            ] as const).map((opt) => (
              <SegmentedOption
                key={opt.value}
                $active={(theme.buttonRadius || 'full') === opt.value}
                onClick={() => onChange({...pageConfig, theme: {...theme, buttonRadius: opt.value}})}
              >
                {opt.label}
              </SegmentedOption>
            ))}
          </SegmentedControl>
        </Field>
        <Field>
          <FieldLabel>Font</FieldLabel>
          <Select
            value={theme.fontFamily || ''}
            options={[{value: '', label: 'System default'}, ...FONT_OPTIONS.map((f) => ({...f, label: fontsLoaded ? f.label : `${f.label} ...`}))]}
            disabled={!fontsLoaded}
            onChange={(e) => {
              const val = (e.target as HTMLSelectElement).value;
              onChange({...pageConfig, theme: {...theme, fontFamily: val || undefined}});
            }}
          />
        </Field>
      </CollapsibleSection>

      {/* Assets */}
      <CollapsibleSection title="Assets" icon={SwatchBookIcon}>
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
      <CollapsibleSection title="Media" icon={GalleryHorizontalEndIcon}>
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
      <CollapsibleSection title="Links" icon={LinkIcon}>
        {nonPlatformLinks.map((link) => (
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

      {/* Platform Links */}
      <CollapsibleSection title="Platform Links" icon={GamepadIcon}>
        {platformLinks.map((link) => (
          <LinkEntry key={link.id}>
            <LinkEntryHeader>
              <Select
                size="sm"
                fullWidth
                value={link.type}
                options={PLATFORM_LINK_TYPE_OPTIONS}
                onChange={(e) => handleUpdatePlatformLink(link.id, 'type', (e.target as HTMLSelectElement).value as string)}
              />
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => handleDeletePlatformLink(link.id)}
              >
                <Trash2Icon size={14} />
              </IconButton>
            </LinkEntryHeader>
            <Input
              value={link.label}
              onChange={(e) => handleUpdatePlatformLink(link.id, 'label', e.target.value)}
              placeholder="Label"
            />
            <Input
              value={link.url}
              onChange={(e) => handleUpdatePlatformLink(link.id, 'url', e.target.value)}
              placeholder="https://... (optional)"
            />
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={link.comingSoon || false}
                onChange={(e) => handleUpdatePlatformLink(link.id, 'comingSoon', e.target.checked)}
              />
              Coming soon
            </CheckboxLabel>
          </LinkEntry>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddPlatformLink}
        >
          <PlusIcon size={14} className="mr-2" />
          Add platform link
        </Button>
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

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--fg);
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

const ColorRow = styled.div`
  display: flex;
  gap: var(--spacing-2);

  > * {
    flex: 1;
    min-width: 0;
  }
`;

const SegmentedControl = styled.div`
  display: flex;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
`;

const SegmentedOption = styled.button<{$active: boolean}>`
  flex: 1;
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.15s;
  background: ${(p) => (p.$active ? 'var(--bg-surface)' : 'transparent')};
  color: ${(p) => (p.$active ? 'var(--fg)' : 'var(--fg-muted)')};
  box-shadow: ${(p) => (p.$active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none')};

  &:hover {
    color: var(--fg);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: var(--fg-muted);
  cursor: pointer;
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

