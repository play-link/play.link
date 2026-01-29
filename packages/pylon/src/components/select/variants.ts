import type {RuleSet} from 'styled-components';
import {css} from 'styled-components';

// Variants for the Select trigger button (not the menu items)
export type SelectVariant = 'default' | 'minimal' | 'muted' | 'ghost' | 'unstyled';

/* UNSTYLED */
const unstyled = css``;

/* DEFAULT - with border */
const defaultStyle = css`
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);

  &:hover,
  &.opened {
    background: var(--bg-press);
  }

  &.placeholder {
    color: var(--fg-placeholder);
  }

  &[disabled] {
    color: var(--fg-placeholder);
    pointer-events: none;
    background: var(--bg-muted);
  }

  &.invalid {
    color: var(--fg-error);
    background: var(--color-red-50);
    border: 1px solid var(--input-outline-error-color);

    .arrow-icon {
      color: var(--fg-error);
    }
  }
`;

/* MINIMAL - no border, subtle hover */
const minimal = css`
  color: var(--fg);

  &:hover,
  &.opened {
    background: var(--bg-press);
  }

  &.placeholder {
    color: var(--fg-placeholder);
  }

  &[disabled] {
    color: var(--fg-placeholder);
    pointer-events: none;
    background: var(--bg-muted);
  }

  &.invalid {
    color: var(--fg-error);
    background: var(--color-red-50);
  }

  &.invalid .arrow-icon {
    color: var(--fg-error);
  }
`;

/* GHOST - no border, no radius, muted */
const ghost = css`
  color: var(--fg-subtle);
  border: none;
  border-radius: 0;

  &.placeholder {
    color: var(--fg-placeholder);
  }

  &:hover,
  &.opened {
    color: var(--fg);

    .placeholder {
      color: var(--fg);
    }

    .arrow-icon {
      color: var(--fg);
    }
  }

  &[disabled] {
    color: var(--fg-placeholder);
    pointer-events: none;
    opacity: 0.5;
  }

  &.invalid {
    color: var(--fg-error);

    .arrow-icon {
      color: var(--fg-error);
    }
  }
`;

/* MUTED - no border, muted color */
const muted = css`
  color: var(--fg-subtle);
  &.placeholder {
    color: var(--fg-placeholder);
  }

  &:hover,
  &.opened {
    background: var(--bg-hover);
  }

  &[disabled] {
    color: var(--fg-placeholder);
    pointer-events: none;
    background: var(--bg-muted);
  }

  &.invalid {
    color: var(--fg-error);
    background: var(--color-red-50);

    .arrow-icon {
      color: var(--fg-error);
    }
  }
`;

export const selectVariantsStyles: {[key in SelectVariant]: RuleSet<object>} = {
  default: defaultStyle,
  minimal,
  ghost,
  muted,
  unstyled,
};
