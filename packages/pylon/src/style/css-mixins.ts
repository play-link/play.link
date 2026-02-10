import {css} from 'styled-components';

export const dropdownOverlayCss = css`
  background: var(--bg-overlay);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  min-width: 12rem;
  padding: var(--spacing-1);
`;

/**
 * @deprecated Will be replaced by `<FullscreenOverlay>` component in the future.
 */
export const fullSizeOverlayCss = css`
  background: var(--bg-overlay);
  border-radius: 0;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  width: 100%;
`;

export const scrollBarCss = css`
  &::-webkit-scrollbar {
    width: 0.5rem;
    height: 0.5rem;
  }

  &::-webkit-scrollbar-track {
    background-color: var(--scroll-track-color);
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--scroll-thumb-color);
    border-radius: 0;
  }

  &::-webkit-scrollbar-button {
    display: none;
  }

  :root[data-theme='dark'] {
  }
`;

export const gradientActiveBorder = css`
  background-clip: padding-box;
  border: solid 3px transparent;

  &.active {
    outline: 1px solid transparent;
    border: solid 3px transparent;
    background:
      linear-gradient(var(--bg-overlay), var(--bg-overlay)) padding-box,
      conic-gradient(
          from var(--angle),
          var(--color-primary-700),
          var(--color-yellow-100),
          var(--color-primary-700)
        )
        border-box;
    animation: rotate 5s linear infinite;
  }

  @keyframes rotate {
    to {
      --angle: 360deg;
    }
  }

  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
`;
