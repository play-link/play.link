import {ImageIcon, Trash2Icon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import styled from 'styled-components';
import {
  Button,
  Fieldset,
  FieldsetController,
  ImageInput,
  Input,
  useSnackbar,
} from '@play/pylon';
import type {EasyCropResp, ImageAspectRatio} from '@play/pylon';
import {uploadImage} from '@/lib/upload';
import {Section, SectionTitle} from './shared';
import type {GameSettingsFormValues, SectionProps} from './types';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  aspectFn?: (ratio: ImageAspectRatio) => number;
  disabled?: boolean;
}

function ImageField({
  label,
  value,
  onChange,
  folder,
  aspectFn,
  disabled,
}: ImageFieldProps) {
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
        <PreviewContainer>
          <PreviewImage src={value} alt={label} />
          <PreviewActions>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onChange('')}
              disabled={disabled}
            >
              <Trash2Icon size={14} />
              Remove
            </Button>
          </PreviewActions>
        </PreviewContainer>
      ) : (
        <UploadArea>
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
                disabled: disabled || uploading,
              },
              showSelectedFileNames: false,
            }}
          />
        </UploadArea>
      )}
    </Fieldset>
  );
}

export function MediaAssetsSection({disabled}: SectionProps) {
  const {control, setValue} = useFormContext<GameSettingsFormValues>();
  const coverUrl = useWatch({control, name: 'coverUrl'});
  const headerUrl = useWatch({control, name: 'headerUrl'});

  return (
    <Section>
      <SectionTitle>Media Assets</SectionTitle>
      <p className="text-sm text-(--fg-subtle) -mt-2 mb-2">
        Source-of-truth assets used across listings, embeds, and previews.
      </p>

      <ImageField
        label="Cover image"
        value={coverUrl}
        onChange={(url) => setValue('coverUrl', url, {shouldDirty: true})}
        folder="games/covers"
        aspectFn={() => 16 / 9}
        disabled={disabled}
      />

      <ImageField
        label="Header image"
        value={headerUrl}
        onChange={(url) => setValue('headerUrl', url, {shouldDirty: true})}
        folder="games/headers"
        aspectFn={() => 3 / 1}
        disabled={disabled}
      />

      <FieldsetController
        control={control}
        name="trailerUrl"
        rules={{
          pattern: {
            value: /^(https?:\/\/.+)?$/,
            message: 'Must be a valid URL',
          },
        }}
        fieldsetProps={{
          label: 'Trailer URL',
          helpText: 'YouTube or Vimeo link',
        }}
        render={({controlledProps}) => (
          <Input
            {...controlledProps}
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            disabled={disabled}
          />
        )}
      />
    </Section>
  );
}

const PreviewContainer = styled.div`
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-muted);
`;

const PreviewImage = styled.img`
  width: 100%;
  display: block;
  object-fit: cover;
  max-height: 12rem;
`;

const PreviewActions = styled.div`
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
`;

const UploadArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6);
  border: 1px dashed var(--border-muted);
  border-radius: var(--radius-lg);
  background: var(--bg-muted);
`;
