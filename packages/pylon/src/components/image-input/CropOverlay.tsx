import {useCallback, useEffect, useState} from 'react';
import Cropper from 'react-easy-crop';
import type {Area, Point} from 'react-easy-crop';
import styled from 'styled-components';
import {afterNextRender} from '../../lib';
import {DialogOverlay} from '../dialog-overlay';
import {FormSubmit} from '../form';
import {IconButton} from '../icon-button';
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
    <StyledDialogOverlay
      opened={opened}
      setOpened={setOpened}
      maxWidth="300px"
      padding="var(--spacing-3)"
    >
      <StyledCloseIconButton
        name="close"
        size="sm"
        onClick={() => setOpened(false)}
        variant="muted"
      />
      <div className="flex flex-col gap-4 height-100 overflow-hidden">
        <div className="p-4 height-100 flex-1">
          <StyledCropperContainer $roundedCropArea={roundedCropArea}>
            <Cropper
              image={ready ? imageSrc : ''} // NOTE: Quick fix for the image not being loaded on first render
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
        </div>
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="fg-muted text-md font-medium">-</div>
            <NativeInputRange
              value={zoom}
              min={1}
              max={3}
              step={0.01}
              aria-labelledby="Zoom"
              onChange={(evt: any) => {
                setZoom(Number(evt.currentTarget.value));
              }}
              className="width-full"
            />
            <div className="fg-muted text-md font-medium">+</div>
          </div>
          <FormSubmit submitting={loading} variant="primary" onClick={handleSubmit}>
            Save
          </FormSubmit>
        </div>
      </div>
    </StyledDialogOverlay>
  );
}

const StyledDialogOverlay = styled(DialogOverlay)`
  height: 100%;
  max-height: 350px;
  overflow: hidden;
`;

const StyledCropperContainer = styled.div<{$roundedCropArea: boolean}>`
  height: 100%;
  position: relative;
  .reactEasyCrop_CropArea {
    color: var(--bg-body) !important;
    ${({$roundedCropArea}) => $roundedCropArea && 'border-radius: 50%;'}
  }
`;

const StyledCloseIconButton = styled(IconButton)`
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
`;
