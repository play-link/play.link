import type {HTMLAttributes} from 'react';
import {useEffect, useState} from 'react';
import styled, {keyframes} from 'styled-components';

export const LOADING_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export type LoadingSize = (typeof LOADING_SIZES)[number];

export type LoadingProps = HTMLAttributes<HTMLDivElement> & {
  size?: LoadingSize | number;
};

const SIZE_MAP: Record<LoadingSize, number> = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 48,
} as const;

const ANIMATION_DELAY_MS = 50;

export function Loading({size = 'md', ...restProps}: LoadingProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), ANIMATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const resolvedSize = typeof size === 'number' ? size : SIZE_MAP[size];

  return (
    <Wrapper role="status" aria-label="Loading" {...restProps}>
      <SpinningSvg viewBox="25 25 50 50" strokeWidth={4} $size={resolvedSize} $isReady={isReady}>
        <circle cx="50" cy="50" r="20" />
      </SpinningSvg>
    </Wrapper>
  );
}

const rotate = keyframes`
  100% {
    transform: rotate(360deg);
  }
`;

const stretch = keyframes`
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dashoffset: -124px;
  }
`;

const Wrapper = styled.div`
  color: var(--fg-subtle);
  display: inline-flex;
`;

interface SpinningSvgProps {
  $size: number;
  $isReady: boolean;
}

const SpinningSvg = styled.svg<SpinningSvgProps>`
  animation: ${rotate} 2s linear infinite;
  height: ${({$size}) => $size}px;
  transform-origin: center;
  vertical-align: middle;
  width: ${({$size}) => $size}px;
  will-change: transform;

  & circle {
    animation: ${stretch} 1.5s ease-in-out infinite;
    display: ${({$isReady}) => ($isReady ? 'initial' : 'none')};
    fill: none;
    stroke: currentColor;
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
    stroke-linecap: round;
  }
`;
