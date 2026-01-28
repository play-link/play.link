import {useCallback, useState} from 'react';
import type {InputFileProps} from '../input-file';
import {InputFile} from '../input-file';
import type {EasyCropResp} from './crop-image';
import {CropOverlay} from './CropOverlay';

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export type ImageAspectRatio = 'landscape' | 'portrait';

export interface ImageInputProps {
  aspectFn?: (aspectRatio: ImageAspectRatio) => number;
  inputFileProps?: InputFileProps;
  onSubmit?: (props: EasyCropResp & {aspectRatio: ImageAspectRatio}) => void;
  ref?: React.Ref<HTMLInputElement>;
  roundedCropArea?: boolean;
}

export function ImageInput({
  ref,
  aspectFn,
  inputFileProps,
  onSubmit,
  roundedCropArea = false,
}: ImageInputProps) {
  const [base64, setBase64] = useState<string | null>(null);
  const [opened, setOpened] = useState<boolean>(false);

  const onInputFileChange = useCallback(async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const {files} = evt.target;
    if (files && files.length > 0) {
      const file = files[0];
      try {
        const imageDataUrl = await readFile(file);
        setBase64(imageDataUrl);
        setOpened(true);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  }, []);

  const onInputFileClick = useCallback((evt: React.MouseEvent<HTMLInputElement>) => {
    // Reset the input value to allow re-selecting the same file
    (evt.target as HTMLInputElement).value = '';
  }, []);

  return (
    <>
      <InputFile
        ref={ref}
        onChange={onInputFileChange}
        onClick={onInputFileClick}
        {...inputFileProps}
      />
      {opened && base64 && (
        <CropOverlay
          opened={opened}
          setOpened={setOpened}
          aspectFn={aspectFn}
          imageSrc={base64}
          onSubmit={onSubmit}
          roundedCropArea={roundedCropArea}
        />
      )}
    </>
  );
}
