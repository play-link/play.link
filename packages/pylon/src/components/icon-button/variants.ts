import type {RuleSet} from 'styled-components';
import {css} from 'styled-components';
import type {IconButtonSize} from './IconButton';

export type IconButtonVariant =
  | 'unstyled'
  | 'default'
  | 'muted'
  | 'ghost'
  | 'filled'
  | 'filled-primary'
  | 'outline'
  | 'primary';

export function getVariant({
  variant,
  size,
  withArrow,
}: {
  variant: IconButtonVariant;
  size: IconButtonSize;
  withArrow: boolean;
}) {
  return css`
    ${variant !== 'unstyled' &&
    css`
      transition: background-color 0.2s var(--ease-in-out);
      border-radius: var(--radius-full);
      height: var(--control-height-${size});
      width: ${withArrow ? 'auto' : `var(--control-height-${size})`};
      ${withArrow && 'padding-inline: 0.5rem;'}
      border-radius: var(--control-radius-${size});
    `}
    ${variantsStyles[variant]}
  `;
}

export const variantsStyles: {
  [_key in IconButtonVariant]: RuleSet<object>;
} = {
  /* Unstyled */
  unstyled: css`
    color: inherit;
  `,

  /* Default */
  default: css`
    color: var(--fg);
    border: 1px solid transparent;

    &:hover {
      background: var(--bg-press);
    }

    &.opened {
      background: var(--bg-press);
      border-color: var(--bg-press);
    }
  `,

  outline: css`
    border: 1px solid var(--border);
    color: var(--fg);

    &:hover {
      background-color: var(--bg-press);
    }

    &.opened {
      background-color: var(--bg-hover);
    }
  `,

  /* Ghost */
  ghost: css`
    color: var(--fg-subtle);
    background-color: transparent;

    &:hover {
      color: var(--fg);
    }
  `,
  /* Filled Primary */
  primary: css`
    background: var(--color-primary-600);
    color: var(--primary-contrast-text);

    &:hover {
      background: var(--color-primary-700);
    }
  `,

  /* Filled */
  filled: css`
    background-color: var(--bg-hover);
    color: var(--fg);

    &:hover {
      background-color: var(--bg-press);
    }
  `,

  /* Filled Primary */
  'filled-primary': css`
    background-color: var(--color-primary-50);
    color: var(--color-primary-700);

    &:hover {
      background-color: var(--color-primary-100);
    }
  `,

  /* Muted */
  muted: css`
    color: var(--fg-subtle);
    border-radius: var(--control-radius-md);

    &:hover {
      background: var(--bg-hover);
      color: var(--fg);
    }

    &.opened {
      background: var(--bg-hover);
    }
  `,
};
