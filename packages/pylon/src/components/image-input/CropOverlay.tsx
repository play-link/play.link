import {useCallback, useEffect, useState} from 'react';
import Cropper from 'react-easy-crop';
import type {Area, Point} from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import styled from 'styled-components';
import {afterNextRender} from '../../lib';
import {DialogOverlay} from '../dialog-overlay';
import {FormSubmit} from '../form';
import {NativeInputRange} from '../input-range';
import {cropImage} from './crop-image';
import type {ImageAspectRatio, ImageInputProps} from './ImageInput';

type Props = {
  imageSrc: string;
  opened: boolean;
  setOpened: (opened: boolean) => void;
} & Pick<ImageInputProps, 'aspectFn' | 'onSubmit' | 'roundedCropArea'>;

export function CropOverlay({
  aspectFn,
  imageSrc,
  onSubmit,
  opened,
  roundedCropArea = false,
  setOpened,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('landscape');
  const [crop, setCrop] = useState<Point>({x: 0, y: 0});
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>();
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSubmit = async () => {
    if (croppedAreaPixels) {
      setLoading(true);
      const croppedImage = await cropImage(imageSrc, croppedAreaPixels, 0);
      if (croppedImage && onSubmit) {
        onSubmit({...croppedImage, aspectRatio});
      }
      setOpened(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (opened) {
      afterNextRender(() => {
        setReady(true);
      });
    }
  }, [opened]);

  return (
    <StyledDialogOverlay opened={opened} setOpened={setOpened}>
      <DialogOverlay.Header showCloseButton>Crop image</DialogOverlay.Header>
      <DialogOverlay.Content>
        <ContentBody>
          <StyledCropperContainer $roundedCropArea={roundedCropArea}>
            <Cropper
              image={ready ? imageSrc : ''} // NOTE: Workaround for first-render media sizing.
              crop={crop}
              zoom={zoom}
              maxZoom={3}
              aspect={aspectFn ? aspectFn(aspectRatio) : 19 / 9}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              showGrid={false}
              onMediaLoaded={(mediaSize) => {
                if (mediaSize.naturalHeight > mediaSize.naturalWidth) {
                  setAspectRatio('portrait');
                }
              }}
            />
          </StyledCropperContainer>
          <ZoomRow>
            <ZoomMark>-</ZoomMark>
            <NativeInputRange
              value={zoom}
              min={1}
              max={3}
              step={0.01}
              aria-label="Zoom"
              onChange={(evt) => {
                setZoom(Number(evt.currentTarget.value));
              }}
            />
            <ZoomMark>+</ZoomMark>
          </ZoomRow>
        </ContentBody>
      </DialogOverlay.Content>
      <DialogOverlay.Footer>
        <FormSubmit
          submitting={loading}
          variant="primary"
          onClick={handleSubmit}
          style={{width: '100%'}}
        >
          Save
        </FormSubmit>
      </DialogOverlay.Footer>
    </StyledDialogOverlay>
  );
}

const StyledDialogOverlay = styled(DialogOverlay)`
  overflow: hidden;
`;

const ContentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const StyledCropperContainer = styled.div<{$roundedCropArea: boolean}>`
  height: clamp(15rem, 45vh, 24rem);
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-muted);

  .reactEasyCrop_CropArea {
    color: var(--bg) !important;
    ${({$roundedCropArea}) => $roundedCropArea && 'border-radius: 50%;'}
  }
`;

const ZoomRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const ZoomMark = styled.span`
  color: var(--fg-muted);
  font-size: var(--text-md);
  font-weight: var(--font-weight-medium);
`;
