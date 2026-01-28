import type {RuleSet} from 'styled-components';
import {css} from 'styled-components';

// Variants for the Select trigger button (not the menu items)
export type SelectVariant =
  | 'default'
  | 'muted'
  | 'ghost'
  | 'outline'
  | 'outline-muted'
  | 'unstyled';

/* UNSTYLED */
const unstyled = css``;

/* DEFAULT */
const defaultStyle = css`
  color: var(--fg-body);

  &:hover,
  &.opened {
    background: var(--bg-deep);
  }

  &.placeholder {
    color: var(--fg-placeholder);
  }

  &[disabled] {
    color: var(--fg-placeholder);
    pointer-events: none;
    background: var(--bg-soft);
  }

  &.invalid {
    color: var(--fg-error);
    background: var(--color-red-50);
  }

  &.invalid .arrow-icon {
    color: var(--fg-error);
  }
`;

const ghost = css`
  color: var(--fg-muted);
  border: none;
  border-radius: 0;

  &.placeholder {
    color: var(--fg-placeholder);
  }

  &:hover,
  &.opened {
    color: var(--fg-body);

    .placeholder {
      color: var(--fg-body);
    }

    .arrow-icon {
      color: var(--fg-body);
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

/* Muted */
const muted = css`
  color: var(--fg-muted);
  &.placeholder {
    color: var(--fg-placeholder);
  }

  &:hover,
  &.opened {
    background: var(--bg-subtle);
  }

  &[disabled] {
    color: var(--fg-placeholder);
    pointer-events: none;
    background: var(--bg-soft);
  }

  &.invalid {
    color: var(--fg-error);
    background: var(--color-red-50);

    .arrow-icon {
      color: var(--fg-error);
    }
  }
`;

/* OUTLINE */
const outline = css`
  border: 1px solid var(--border-deep);
  background: transparent;
  color: var(--fg-body);

  &:hover,
  &.opened {
    background: var(--bg-deep);
  }

  &.placeholder {
    color: var(--fg-placeholder);
  }

  &[disabled] {
    color: var(--fg-placeholder);
    pointer-events: none;
    background: var(--bg-soft);
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

/* OUTLINE MUTED */
const outlineMuted = css`
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--fg-muted);

  &:hover,
  &.opened {
    color: var(--fg-body);
    background: var(--bg-deep);
  }

  &.placeholder {
    color: var(--fg-placeholder);
  }

  &[disabled] {
    color: var(--fg-placeholder);
    pointer-events: none;
    background: var(--bg-soft);
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

export const selectVariantsStyles: {[key in SelectVariant]: RuleSet<object>} = {
  'outline-muted': outlineMuted,
  default: defaultStyle,
  ghost,
  muted,
  outline,
  unstyled,
};
