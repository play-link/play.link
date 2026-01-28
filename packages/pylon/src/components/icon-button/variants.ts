import type {RuleSet} from 'styled-components';
import {css} from 'styled-components';
import type {IconButtonSize} from './IconButton';

export type IconButtonVariant =
  | 'unstyled'
  | 'default'
  | 'muted'
  | 'ghost'
  | 'filled'
  | 'filled-primary';

export function getVariant({variant, size}: {variant: IconButtonVariant; size: IconButtonSize}) {
  return css`
    ${variant !== 'unstyled' &&
    css`
      transition: background-color 0.2s var(--ease-in-out);
      border-radius: var(--radius-full);
      height: var(--icon-button-height-${size});
      width: var(--icon-button-height-${size});
      border-radius: var(--button-radius-${size});
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
    color: var(--fg-body);

    &:hover {
      background-color: var(--bg-subtle);
    }

    &.opened {
      background-color: var(--bg-subtle);
    }
  `,

  /* Ghost */
  ghost: css`
    color: var(--fg-muted);
    background-color: transparent;

    &:hover {
      color: var(--fg-body);
    }
  `,

  /* Filled */
  filled: css`
    background-color: var(--bg-subtle);
    color: var(--fg-body);

    &:hover {
      background-color: var(--bg-deep);
    }
  `,

  /* Filled Primary */
  'filled-primary': css`
    background-color: var(--color-green-50);
    color: var(--color-green-700);

    &:hover {
      background-color: var(--color-green-100);
    }
  `,

  /* Muted */
  muted: css`
    color: var(--fg-muted);
    border-radius: var(--button-radius-md);

    &:hover {
      background: var(--bg-subtle);
      color: var(--fg-body);
    }

    &.opened {
      background: var(--bg-subtle);
    }
  `,
};
