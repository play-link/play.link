import styled, {css, keyframes} from 'styled-components';

interface Props {
  animation?: boolean;
  className?: string;
  height?: string;
  style?: React.CSSProperties;
  variant?: 'rectangular' | 'circular' | 'rounded';
  width?: string;
}

const shimmer = keyframes`
  100% {
    transform: translateX(100%);
  }
`;

export function Skeleton({
  animation = true,
  height = '1rem',
  variant = 'rounded',
  width = '1rem',
  ...props
}: Props) {
  return (
    <StyledSkeleton
      $animation={animation}
      $height={height}
      $variant={variant}
      $width={width}
      {...props}
    />
  );
}

interface StyledSkeletonProps {
  $animation: boolean;
  $variant: 'rectangular' | 'circular' | 'rounded';
  $width: string;
  $height: string;
}

const StyledSkeleton = styled.div<StyledSkeletonProps>`
  background: var(--bg-soft);
  border-radius: ${({$variant, $width}) =>
    $variant === 'circular' ? `${$width}` : $variant === 'rounded' ? 'var(--radius-md)' : '0'};
  height: ${({$height}) => $height};
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  width: ${({$width}) => $width};

  ${({$animation}) =>
    $animation &&
    css`
      &::after {
        animation: ${shimmer} 1.25s infinite;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.3) 25%,
          rgba(255, 255, 255, 0.6) 60%,
          rgba(255, 255, 255, 0)
        );
        content: '';
        inset: 0;
        position: absolute;
        transform: translateX(-100%);
      }
    `}
`;
