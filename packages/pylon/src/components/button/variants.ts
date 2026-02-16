import {css} from 'styled-components';
import type {RuleSet} from 'styled-components';

export const BUTTON_VARIANTS = [
  'default',
  'destructive-soft',
  'destructive',
  'ghost',
  'link',
  'menu-destructive',
  'menu',
  'muted',
  'nav',
  'outline-muted',
  'outline',
  'primary',
  'unstyled',
] as const;

export const BUTTON_SIZES = ['xs', 'sm', 'md', 'lg'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface VariantParams {
  size: ButtonSize;
  autoHeight: boolean;
  fullRounded: boolean;
  elevated?: boolean;
  emphasis?: boolean;
}

export interface VariantConfig {
  /** Wrap children in an inner <span> (for layered transform effects) */
  wrapped?: boolean;
  /** CSS styles applied to the button element */
  styles: (params: VariantParams) => RuleSet<object>;
}

// ── Shared helpers ──

const base = ({size, autoHeight, fullRounded}: VariantParams) => css`
  border-radius: ${fullRounded ? 'var(--radius-full)' : `var(--control-radius-${size})`};
  height: ${autoHeight ? 'auto' : `var(--control-height-${size})`};
  padding: var(--control-padding-${size});
  transition:
    background-color 0.15s linear,
    color 0.15s linear;
`;

const menuBase = (params: VariantParams) => css`
  ${base(params)}
  border-radius: var(--radius-lg);
  color: var(--fg);
  flex-shrink: 0;
  justify-content: flex-start;
  position: relative;
  width: 100%;

  &:hover,
  &.hover {
    background: var(--bg-hover);
  }

  &:active {
    background: var(--bg-press);
  }

  &:focus-visible {
    outline: none;
  }
`;

// ── Variants ──

export const variants: Record<ButtonVariant, VariantConfig> = {
  unstyled: {
    styles: () => css``,
  },

  default: {
    styles: (p) => css`
      ${base(p)}
      justify-content: center;
      background: var(--fg);
      color: var(--bg);

      &:hover {
        background: var(--fg-subtle);
      }
    `,
  },

  primary: {
    wrapped: true,
    styles: (p) => css`
      ${base(p)}
      background: var(--color-primary-600);
      color: var(--primary-contrast-text);
      justify-content: center;
      padding: 0;
      position: relative;
      transform: translateY(2px);

      > span {
        align-items: inherit;
        display: inherit;
        flex: 1 1 0%;
        gap: inherit;
        justify-content: inherit;
        overflow: hidden;
        padding: var(--control-padding-${p.size});
        position: relative;
        transform: translateY(-2px);
        transition: transform 120ms cubic-bezier(0.8, -0.4, 0.5, 1);
        white-space: nowrap;
        z-index: 1;
      }

      &:before {
        content: '';
        display: block;
        position: absolute;
        inset: 2px 0px 0px;
        height: calc(100% - 2px);
        transform: translateY(-2px);
        box-shadow: var(--color-primary-800) 0px 2px 0px 0px;
        background: var(--color-primary-800);
        border-radius: inherit;
      }

      &:after {
        content: '';
        background: var(--color-primary-600);
        border-radius: inherit;
        border: 1px solid var(--color-primary-800);
        display: block;
        inset: 0px;
        position: absolute;
        transform: translateY(-2px);
        transition: transform 120ms cubic-bezier(0.8, -0.4, 0.5, 1);
      }

      &:hover::after,
      &:hover > span {
        transform: translateY(calc(-3px));
      }

      &:active::after,
      &:active > span {
        transform: translateY(0rem);
      }
    `,
  },

  muted: {
    styles: (p) => css`
      ${base(p)}
      justify-content: center;
      background: ${p.elevated ? 'var(--bg-highlight)' : 'var(--bg-press)'};
      color: var(--fg);

      &:hover {
        background: var(--border);
      }

      &.active {
        background: var(--border);
        color: var(--fg);
      }
    `,
  },

  ghost: {
    styles: (p) => css`
      ${base(p)}
      justify-content: center;
      color: ${p.emphasis ? 'var(--fg)' : 'var(--fg-muted)'};

      &:hover {
        color: var(--fg);
        background: ${p.elevated ? 'var(--bg-press)' : 'var(--bg-hover)'};
      }

      &.active {
        background: ${p.elevated ? 'var(--bg-press)' : 'var(--bg-hover)'};
        color: var(--fg);
        font-weight: var(--font-weight-medium);
      }

      &:active {
        background: var(--color-gray-150);
      }
    `,
  },

  outline: {
    wrapped: true,
    styles: (p) => css`
      ${base(p)}
      color: var(--fg);
      justify-content: center;
      padding: 0;
      position: relative;
      transform: translateY(2px);

      > span {
        align-items: inherit;
        display: inherit;
        flex: 1 1 0%;
        gap: inherit;
        justify-content: inherit;
        overflow: hidden;
        padding: var(--control-padding-${p.size});
        position: relative;
        transform: translateY(-2px);
        transition: transform 120ms cubic-bezier(0.8, -0.4, 0.5, 1);
        white-space: nowrap;
        z-index: 1;
      }

      &:before {
        content: '';
        display: block;
        position: absolute;
        inset: 2px 0px 0px;
        height: calc(100% - 2px);
        transform: translateY(-2px);
        box-shadow: var(--border-subtle) 0px 2px 0px 0px;
        background: var(--border-subtle);
        border-radius: inherit;
      }

      &:after {
        content: '';
        background: var(--bg);
        border-radius: inherit;
        border: 1px solid var(--border-subtle);
        display: block;
        inset: 0px;
        position: absolute;
        transform: translateY(-2px);
        transition: transform 120ms cubic-bezier(0.8, -0.4, 0.5, 1);
      }

      &:hover::after,
      &:hover > span {
        transform: translateY(calc(-3px));
      }

      &:active::after,
      &:active > span {
        transform: translateY(0rem);
      }
    `,
  },

  'outline-muted': {
    styles: (p) => css`
      ${base(p)}
      justify-content: center;
      border: 1px solid var(--border);
      color: var(--fg-subtle);

      &:hover {
        background: var(--bg-press);
      }

      &.active {
        color: var(--fg);
        border-color: var(--fg);
      }
    `,
  },

  destructive: {
    styles: (p) => css`
      ${base(p)}
      justify-content: center;
      background: var(--color-red-500);
      color: var(--white);

      &:hover {
        background: var(--color-red-600);
      }
    `,
  },

  'destructive-soft': {
    styles: (p) => css`
      ${base(p)}
      justify-content: center;
      background: var(--color-red-100);
      color: var(--color-red-700);

      &:hover {
        background: var(--color-red-200);
      }
    `,
  },

  link: {
    styles: (p) => css`
      ${base(p)}
      justify-content: center;
      color: var(--primary);

      &:hover {
        background: var(--bg-hover);
      }

      &:active {
        background: var(--bg-press);
      }
    `,
  },

  menu: {
    styles: (p) => css`
      ${menuBase(p)}
    `,
  },

  'menu-destructive': {
    styles: (p) => css`
      ${menuBase(p)}
      color: var(--color-red-400);
    `,
  },

  nav: {
    styles: (p) => css`
      ${base(p)}
      border-radius: var(--radius-lg);
      color: var(--fg-muted);
      flex-shrink: 0;
      justify-content: flex-start;
      padding: 0 var(--spacing-3);
      transition: background 0.1s ease;

      &:hover {
        background: var(--bg-hover);
      }

      &:active {
        background: var(--bg-press);
      }

      &.active,
      &.opened {
        background: var(--bg-selected);
        color: var(--fg);
      }
    `,
  },
};
