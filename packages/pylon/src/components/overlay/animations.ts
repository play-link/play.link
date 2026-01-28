import {css} from 'styled-components';
import {mediaQuery} from '../../style';

export type OverlayAnimation =
  | 'move-up'
  | 'move-down'
  | 'move-right'
  | 'move-left'
  | 'scale-in'
  | 'opacity'
  | 'pop';

const moveUp = css`
  transform: translateY(10px);
  transition:
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease,
    visibility 0s 0s;

  &.animate-in,
  &.opened {
    opacity: 1;
    transform: translateY(0);
  }
`;

const moveDown = css`
  transform: translateY(-10px);
  transition:
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease,
    visibility 0s 0s;

  &.animate-in,
  &.opened {
    opacity: 1;
    transform: translateY(0);
  }
`;

const moveRight = css`
  transform: translateX(-20px);
  transition:
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease,
    visibility 0s 0s;

  &.animate-in,
  &.opened {
    opacity: 1;
    transform: translateX(0);
  }
`;

const moveLeft = css`
  transform: translateX(20px);
  transition:
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease,
    visibility 0s 0s;

  ${mediaQuery(
    '<md',
    css`
      transform: translateX(75%);
      transition:
        transform 0.75s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.25s ease,
        visibility 0s 0s;
    `,
  )}

  &.animate-in,
  &.opened {
    opacity: 1;
    transform: translateX(0);
  }
`;

const scaleIn = css`
  opacity: 0;
  transform: scale(0.9);
  transition:
    opacity 300ms,
    transform 300ms;

  &.animate-in,
  &.opened {
    opacity: 1;
    transform: translateX(0);
  }
`;

const opacity = css`
  opacity: 0;
  transition: opacity 300ms;

  &.animate-in,
  &.opened {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pop = css`
  opacity: 0;
  transform: rotateX(-30deg);
  transition:
    transform 0.25s ease 0s,
    opacity 0.25s ease 0s;

  &.animate-in,
  &.opened {
    opacity: 1;
    transform: rotateX(0);
  }
`;

const shake = css`
  animation: shake 0.5s ease-in-out;
`;

// Add the keyframes for shake animation
const shakeKeyframes = css`
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    10%,
    30%,
    50%,
    70%,
    90% {
      transform: translateX(-4px);
    }
    20%,
    40%,
    60%,
    80% {
      transform: translateX(4px);
    }
  }
`;

export function getAnimationCss(
  animation: OverlayAnimation | undefined,
): ReturnType<typeof css> | null {
  switch (animation) {
    case 'move-up':
      return moveUp;
    case 'move-down':
      return moveDown;
    case 'move-right':
      return moveRight;
    case 'move-left':
      return moveLeft;
    case 'scale-in':
      return scaleIn;
    case 'opacity':
      return opacity;
    case 'pop':
      return pop;
    default:
      return null;
  }
}

export function getShakeCss(): ReturnType<typeof css> {
  return css`
    ${shakeKeyframes}
    ${shake}
  `;
}
