import type {Area} from 'react-easy-crop';

export interface EasyCropResp {
  base64: string;
  arrayBuffer: ArrayBuffer;
}

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // needed to avoid cross-origin issues on CodeSandbox
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

export function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(
  width: number,
  height: number,
  rotation: number,
): {width: number; height: number} {
  const rotRad = getRadianAngle(rotation);

  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * This function was adapted from the one in the ReadMe of
 * https://github.com/DominicTobias/react-image-crop
 */
export async function cropImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip: {horizontal: boolean; vertical: boolean} = {
    horizontal: false,
    vertical: false,
  },
): Promise<EasyCropResp | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const {width: bBoxWidth, height: bBoxHeight} = rotateSize(image.width, image.height, rotation);

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and
  // flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  // set canvas width to final desired crop size - this will clear
  // existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
    canvas.toBlob((file: any) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        resolve(fileReader.result as ArrayBuffer);
      };
      fileReader.readAsArrayBuffer(file);
    });
  });

  // As Base64 string
  return {
    base64: canvas.toDataURL('image/jpeg'),
    arrayBuffer,
  };
}
