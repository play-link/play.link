import {ImageIcon, Trash2Icon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {useForm} from 'react-hook-form';
import {
  Button,
  Card,
  ColorPickerInput,
  Fieldset,
  ImageInput,
  Input,
  Textarea,
  useSnackbar,
} from '@play/pylon';
import type {EasyCropResp, ImageAspectRatio} from '@play/pylon';
import {trpc} from '@/lib';
import {uploadImage} from '@/lib/upload';

type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface Studio {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  cover_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  bio: string | null;
  social_links: Record<string, string> | null;
  role: MemberRole;
}

interface StudioSettingsFormProps {
  studio: Studio;
}

const SOCIAL_KEYS = [
  {key: 'website', label: 'Website'},
  {key: 'twitter', label: 'Twitter'},
  {key: 'discord', label: 'Discord'},
  {key: 'youtube', label: 'YouTube'},
  {key: 'tiktok', label: 'TikTok'},
  {key: 'instagram', label: 'Instagram'},
  {key: 'github', label: 'GitHub'},
] as const;

interface ProfileFormValues {
  avatarUrl: string;
  coverUrl: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  bio: string;
  socialLinks: Record<string, string>;
}

// ---------------------------------------------------------------------------
// ImageField (local helper)
// ---------------------------------------------------------------------------

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  aspectFn?: (ratio: ImageAspectRatio) => number;
}

function ImageField({label, value, onChange, folder, aspectFn}: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const {showSnackbar} = useSnackbar();

  const handleSubmit = useCallback(
    async (result: EasyCropResp & {aspectRatio: ImageAspectRatio}) => {
      setUploading(true);
      try {
        const {url} = await uploadImage(result.arrayBuffer, folder);
        onChange(url);
        showSnackbar({message: `${label} uploaded`, severity: 'success'});
      } catch (error) {
        showSnackbar({
          message: error instanceof Error ? error.message : 'Upload failed',
          severity: 'error',
        });
      } finally {
        setUploading(false);
      }
    },
    [folder, label, onChange, showSnackbar],
  );

  return (
    <Fieldset label={label}>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-(--border-muted)">
          <img src={value} alt={label} className="w-full block object-cover max-h-48" />
          <div className="absolute top-2 right-2">
            <Button variant="ghost" size="xs" onClick={() => onChange('')}>
              <Trash2Icon size={14} />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-6 border border-dashed border-(--border-muted) rounded-lg bg-(--bg-muted)">
          <ImageIcon size={24} className="text-(--fg-subtle)" />
          <ImageInput
            aspectFn={aspectFn}
            onSubmit={handleSubmit}
            inputFileProps={{
              accept: 'image/jpeg,image/png,image/webp',
              placeholder: uploading ? 'Uploading...' : 'Choose image',
              buttonProps: {
                variant: 'ghost',
                size: 'sm',
                disabled: uploading,
              },
              showSelectedFileNames: false,
            }}
          />
        </div>
      )}
    </Fieldset>
  );
}

// ---------------------------------------------------------------------------
// StudioSettingsForm
// ---------------------------------------------------------------------------

export function StudioSettingsForm({studio}: StudioSettingsFormProps) {
  const {showSnackbar} = useSnackbar();

  // ---- Identity form (change request) ------------------------------------
  const identityForm = useForm({
    defaultValues: {
      name: studio.name,
      slug: studio.slug,
    },
  });

  const createChangeRequest = trpc.changeRequest.create.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Change request submitted', severity: 'success'});
    },
    onError: (err) => {
      showSnackbar({message: err.message, severity: 'error'});
    },
  });

  const onIdentitySubmit = (data: {name: string; slug: string}) => {
    if (data.name && data.name !== studio.name) {
      createChangeRequest.mutate({
        entityType: 'studio',
        entityId: studio.id,
        fieldName: 'name',
        requestedValue: data.name,
      });
    }

    if (data.slug && data.slug !== studio.slug) {
      createChangeRequest.mutate({
        entityType: 'studio',
        entityId: studio.id,
        fieldName: 'slug',
        requestedValue: data.slug,
      });
    }
  };

  // ---- Profile form (branding, about, socials) ---------------------------
  const socialDefaults: Record<string, string> = {};
  for (const {key} of SOCIAL_KEYS) {
    socialDefaults[key] = studio.social_links?.[key] ?? '';
  }

  const profileForm = useForm<ProfileFormValues>({
    defaultValues: {
      avatarUrl: studio.avatar_url ?? '',
      coverUrl: studio.cover_url ?? '',
      backgroundColor: studio.background_color ?? '',
      accentColor: studio.accent_color ?? '',
      textColor: studio.text_color ?? '',
      bio: studio.bio ?? '',
      socialLinks: socialDefaults,
    },
  });

  const [avatarUrl, setAvatarUrl] = useState(studio.avatar_url ?? '');
  const [coverUrl, setCoverUrl] = useState(studio.cover_url ?? '');

  const updateStudio = trpc.studio.update.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Settings saved', severity: 'success'});
    },
    onError: (err) => {
      showSnackbar({message: err.message, severity: 'error'});
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    // Filter out empty social link values
    const filteredLinks: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.socialLinks)) {
      if (v) filteredLinks[k] = v;
    }

    updateStudio.mutate({
      id: studio.id,
      avatarUrl: avatarUrl || null,
      coverUrl: coverUrl || null,
      backgroundColor: data.backgroundColor || null,
      accentColor: data.accentColor || null,
      textColor: data.textColor || null,
      bio: data.bio || null,
      socialLinks: Object.keys(filteredLinks).length > 0 ? filteredLinks : null,
    });
  };

  const bioValue = profileForm.watch('bio');

  return (
    <div className="flex flex-col gap-6">
      {/* Section 1: Identity */}
      <Card>
        <form onSubmit={identityForm.handleSubmit(onIdentitySubmit)}>
          <h2 className="text-lg font-semibold mb-4">Identity</h2>
          <p className="text-sm text-(--fg-subtle) mb-4">
            Changes to studio name and handle require approval.
          </p>
          <div className="flex flex-col gap-4">
            <Fieldset label="Studio Name">
              <Input {...identityForm.register('name')} />
            </Fieldset>
            <Fieldset label="Studio Handle">
              <div className="flex items-center gap-1">
                <span className="text-sm text-(--fg-muted)">@</span>
                <Input {...identityForm.register('slug')} className="flex-1" />
              </div>
            </Fieldset>
            <div>
              <Button
                type="submit"
                variant="primary"
                disabled={createChangeRequest.isPending}
              >
                Request Change
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Sections 2-4: Branding, About, Social Links */}
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
        {/* Section 2: Branding */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Branding</h2>
          <div className="flex flex-col gap-4">
            <ImageField
              label="Avatar"
              value={avatarUrl}
              onChange={(url) => {
                setAvatarUrl(url);
                profileForm.setValue('avatarUrl', url, {shouldDirty: true});
              }}
              folder="studios/avatars"
              aspectFn={() => 1}
            />

            <ImageField
              label="Cover Image"
              value={coverUrl}
              onChange={(url) => {
                setCoverUrl(url);
                profileForm.setValue('coverUrl', url, {shouldDirty: true});
              }}
              folder="studios/covers"
              aspectFn={() => 16 / 9}
            />

            <Fieldset label="Background Color">
              <ColorPickerInput
                value={profileForm.watch('backgroundColor') || '#030712'}
                onChange={(c) => profileForm.setValue('backgroundColor', c, {shouldDirty: true})}
              />
            </Fieldset>

            <Fieldset label="Accent Color">
              <ColorPickerInput
                value={profileForm.watch('accentColor') || '#818cf8'}
                onChange={(c) => profileForm.setValue('accentColor', c, {shouldDirty: true})}
              />
            </Fieldset>

            <Fieldset label="Text Color">
              <ColorPickerInput
                value={profileForm.watch('textColor') || '#ffffff'}
                onChange={(c) => profileForm.setValue('textColor', c, {shouldDirty: true})}
              />
            </Fieldset>
          </div>
        </Card>

        {/* Section 3: About */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <div className="flex flex-col gap-4">
            <Fieldset label="Bio">
              <Textarea
                {...profileForm.register('bio', {maxLength: 280})}
                placeholder="Tell people about your studio..."
                rows={4}
              />
              <p className="text-xs text-(--fg-subtle) text-right mt-1">
                {bioValue.length}/280
              </p>
            </Fieldset>
          </div>
        </Card>

        {/* Section 4: Social Links */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Social Links</h2>
          <div className="flex flex-col gap-4">
            {SOCIAL_KEYS.map(({key, label}) => (
              <Fieldset key={key} label={label}>
                <Input
                  type="url"
                  placeholder={`https://${key === 'website' ? 'example.com' : `${key}.com/...`}`}
                  {...profileForm.register(`socialLinks.${key}`)}
                />
              </Fieldset>
            ))}
          </div>
        </Card>

        <div>
          <Button
            type="submit"
            variant="primary"
            disabled={updateStudio.isPending}
          >
            {updateStudio.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
