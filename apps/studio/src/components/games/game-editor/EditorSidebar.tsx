import {ImageIcon, PlayIcon, PlusIcon, Trash2Icon, VideoIcon, XIcon} from 'lucide-react';
import {useCallback, useState} from 'react';
import styled from 'styled-components';
import {Button, ColorPickerInput, IconButton, ImageInput, Input, Select, Textarea, useSnackbar} from '@play/pylon';
import type {EasyCropResp, ImageAspectRatio} from '@play/pylon';
import {uploadImage} from '@/lib/upload';

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

interface EditorSidebarProps {
  pageConfig: PageConfig;
  description: string;
  links: EditableLink[];
  media: EditableMedia[];
  onChange: (config: PageConfig) => void;
  onDescriptionChange: (description: string) => void;
  onLinksChange: (links: EditableLink[]) => void;
  onMediaChange: (media: EditableMedia[]) => void;
}

export function EditorSidebar({
  pageConfig,
  description,
  links,
  media,
  onChange,
  onDescriptionChange,
  onLinksChange,
  onMediaChange,
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
      <Section>
        <SectionTitle>Theme Colors</SectionTitle>
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
      </Section>

      <Divider />

      <Section>
        <SectionTitle>Description</SectionTitle>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Tell visitors about your game..."
          rows={6}
        />
      </Section>

      <Divider />

      <Section>
        <SectionTitle>Media</SectionTitle>
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
            <VideoIcon size={14} />
            Add video
          </Button>
        </MediaActions>
      </Section>

      <Divider />

      <Section>
        <SectionTitle>Links</SectionTitle>
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
          <PlusIcon size={14} />
          Add link
        </Button>
      </Section>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
`;

const Divider = styled.div`
  height: 1px;
  background: var(--border-muted);
`;

const SectionTitle = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
