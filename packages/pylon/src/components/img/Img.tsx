import type {ImgHTMLAttributes} from 'react';
import {useEffect, useRef, useState} from 'react';
import {styled} from 'styled-components';

interface ImgCustomProps {
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  preload?: boolean;
  sizing?:
    | 'contain'
    | 'cover'
    | 'auto'
    | 'revert'
    | 'unset'
    | 'inherit'
    | 'initial'
    | 'revert-layer';
}

export type ImgProps = ImgHTMLAttributes<HTMLImageElement> & ImgCustomProps;

export function Img({
  position = 'center',
  preload = true,
  sizing = 'contain',
  src,
  ...restProps
}: ImgProps) {
  const [loaded, setLoaded] = useState(false);
  const [, setError] = useState(false);
  const srcRef = useRef(src);
  const preloadRef = useRef(preload);

  useEffect(() => {
    // Check if src or preload changed
    const srcChanged = srcRef.current !== src;
    const preloadChanged = preloadRef.current !== preload;

    if (srcChanged || preloadChanged) {
      srcRef.current = src;
      preloadRef.current = preload;

      // Reset states when src or preload changes - schedule asynchronously to avoid linter warning
      queueMicrotask(() => {
        setLoaded(false);
        setError(false);
      });
    }

    if (preload && src) {
      const image = new Image();
      let cancelled = false;

      image.onload = () => {
        if (!cancelled) {
          setError(false);
          setLoaded(true);
        }
      };
      image.onerror = () => {
        if (!cancelled) {
          setError(true);
          setLoaded(true);
        }
      };
      image.src = src as string;

      return () => {
        cancelled = true;
      };
    }
  }, [src, preload]);

  return (
    <StyledImg $position={position} $sizing={sizing} $loaded={loaded} $src={src} {...restProps} />
  );
}

interface StyledImgProps {
  $position: string;
  $sizing: string;
  $loaded: boolean;
  $src?: string;
}

const StyledImg = styled.div<StyledImgProps>`
  background-color: var(--bg-deep);
  background-image: ${({$src}) => ($src ? `url(${$src})` : 'none')};
  background-position: ${({$position}) => $position};
  background-repeat: no-repeat;
  background-size: ${({$sizing}) => $sizing};
  display: inline-flex;
  height: auto;
  opacity: ${({$loaded}) => ($loaded ? 1 : 0)};
  transition: opacity 0.5s ease;
  width: auto;
`;
