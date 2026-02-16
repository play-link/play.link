import {ArrowLeftIcon, Gamepad2Icon} from 'lucide-react';
import type {Control} from 'react-hook-form';
import styled from 'styled-components';
import {
  Button,
  DialogOverlay,
  FieldsetController,
  Icon,
  Input,
  Loading,
} from '@play/pylon';
import {FooterSpacer, Subtitle} from '../styles';
import type {FormValues, SteamGamePreview} from '../types';

interface ImportStepProps {
  canProceed: boolean;
  control: Control<FormValues>;
  hasValidSteamUrl: boolean;
  isCheckingPreview: boolean;
  previewError: string | null;
  steamPreview: SteamGamePreview | null;
  title: string;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}

export function ImportStep({
  canProceed,
  control,
  hasValidSteamUrl,
  isCheckingPreview,
  previewError,
  steamPreview,
  title,
  onBack,
  onSkip,
  onNext,
}: ImportStepProps) {
  const previewImage = steamPreview?.coverImage || null;
  const metadata = [
    steamPreview?.releaseDate ? `Release: ${steamPreview.releaseDate}` : null,
    steamPreview?.platforms.length ? steamPreview.platforms.join(' · ') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <DialogOverlay.Header showCloseButton>
        Import from Steam
      </DialogOverlay.Header>
      <DialogOverlay.Content>
        <Subtitle>
          Optionally import metadata and media from Steam for{' '}
          <strong>{title}</strong>.
        </Subtitle>

        <FieldsetController
          control={control}
          name="steamUrl"
          fieldsetProps={{
            label: 'Steam store URL',
            helpText:
              'Example: https://store.steampowered.com/app/123456/your-game',
          }}
          render={({controlledProps}) => (
            <Input {...controlledProps} size="lg" className="w-full" />
          )}
        />

        {hasValidSteamUrl && (
          <PreviewArea>
            {isCheckingPreview && (
              <PreviewCard>
                <PreviewLoadingRow>
                  <Loading size="sm" />
                  <span>Validating Steam game...</span>
                </PreviewLoadingRow>
              </PreviewCard>
            )}

            {!isCheckingPreview && previewError && (
              <PreviewError>{previewError}</PreviewError>
            )}

            {!isCheckingPreview && !previewError && steamPreview && (
              <PreviewCard>
                <PreviewMedia>
                  {previewImage ? (
                    <PreviewImage
                      $imageUrl={previewImage}
                      role="img"
                      aria-label={steamPreview.title || 'Steam game'}
                    />
                  ) : (
                    <PreviewImageFallback>
                      <Icon icon={Gamepad2Icon} size={22} />
                    </PreviewImageFallback>
                  )}
                </PreviewMedia>
                <PreviewInfo>
                  <PreviewTitle>
                    {steamPreview.title || 'Steam game found'}
                  </PreviewTitle>
                  {metadata && <PreviewMeta>{metadata}</PreviewMeta>}
                  {steamPreview.developers.length > 0 && (
                    <PreviewMeta>
                      By {steamPreview.developers.join(', ')}
                    </PreviewMeta>
                  )}
                </PreviewInfo>
              </PreviewCard>
            )}
          </PreviewArea>
        )}
      </DialogOverlay.Content>
      <DialogOverlay.Footer>
        <Button type="button" variant="outline" onClick={onBack}>
          <Icon icon={ArrowLeftIcon} size={16} />
        </Button>
        <FooterSpacer />
        <Button type="button" variant="outline" onClick={onSkip}>
          Skip
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!canProceed}
          onClick={onNext}
        >
          Continue
        </Button>
      </DialogOverlay.Footer>
    </>
  );
}

const PreviewArea = styled.div`
  margin-top: var(--spacing-4);
`;

const PreviewCard = styled.div`
  align-items: flex-start;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  display: flex;
  gap: var(--spacing-4);
  overflow: hidden;
  padding: var(--spacing-3);
`;

const PreviewLoadingRow = styled.div`
  align-items: center;
  color: var(--fg-muted);
  display: inline-flex;
  font-size: var(--text-sm);
  gap: var(--spacing-2);
`;

const PreviewMedia = styled.div`
  aspect-ratio: 15 / 8;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  overflow: hidden;
  width: 9rem;
`;

const PreviewImage = styled.div<{$imageUrl: string}>`
  background-image: ${({$imageUrl}) => `url("${$imageUrl}")`};
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  height: 100%;
  width: 100%;
`;

const PreviewImageFallback = styled.div`
  align-items: center;
  background: var(--bg-muted);
  color: var(--fg-subtle);
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

const PreviewInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
`;

const PreviewTitle = styled.h4`
  color: var(--fg);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  margin: 0;
`;

const PreviewMeta = styled.p`
  color: var(--fg-muted);
  font-size: var(--text-sm);
  margin: 0;
`;

const PreviewError = styled.p`
  background: color-mix(in srgb, var(--fg-error) 10%, transparent);
  border-radius: var(--radius-lg);
  color: var(--fg-error);
  font-size: var(--text-sm);
  margin: 0;
  padding: var(--spacing-3);
`;
