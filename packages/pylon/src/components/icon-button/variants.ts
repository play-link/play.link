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
      height: var(--icon-button-height-${size});
      width: ${withArrow ? 'auto' : `var(--icon-button-height-${size})`};
      ${withArrow && 'padding-inline: 0.5rem;'}
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
    border: 1px solid transparent;

    &:hover {
      background: var(--bg-deep);
    }

    &.opened {
      background: var(--bg-deep);
      border-color: var(--bg-deep);
    }
  `,

  outline: css`
    border: 1px solid var(--border-deep);
    color: var(--fg-body);

    &:hover {
      background-color: var(--bg-deep);
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
  /* Filled Primary */
  primary: css`
    background: var(--primary-bg);
    color: var(--primary-contrast-text);

    &:hover {
      background: var(--primary-bg-hover);
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
    background-color: var(--primary-bg-soft);
    color: var(--primary-active);

    &:hover {
      background-color: var(--primary-bg-soft-hover);
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
