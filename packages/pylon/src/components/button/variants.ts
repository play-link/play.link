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

interface VariantParams {
  size: ButtonSize;
  autoHeight: boolean;
  fullRounded: boolean;
  elevated?: boolean;
  emphasis?: boolean;
}

type VariantStyleFn = (params: VariantParams) => RuleSet<object>;

// Base styles shared across most variants
const baseStyles = ({size, autoHeight, fullRounded}: VariantParams) => {
  return css`
    border-radius: ${fullRounded ? 'var(--radius-full)' : `var(--control-radius-${size})`};
    height: ${autoHeight ? 'auto' : `var(--control-height-${size})`};
    padding: var(--control-padding-${size});
    transition:
      background-color 0.15s linear,
      color 0.15s linear;
  `;
};

// Variant definitions
const unstyled: VariantStyleFn = () => css``;

const defaultVariant: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  justify-content: center;
  background: var(--fg);
  color: var(--bg);

  &:hover {
    background: var(--fg-subtle);
  }
`;

const muted: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  justify-content: center;
  background: ${params.elevated ? 'var(--bg-highlight)' : 'var(--bg-press)'};
  color: var(--fg);

  &:hover {
    background: var(--border);
  }

  &.active {
    background: var(--border);
    color: var(--fg);
  }
`;

const ghost: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  justify-content: center;

  color: ${params.emphasis ? 'var(--fg)' : 'var(--fg-muted)'};

  &:hover {
    color: var(--fg);
    background: ${params.elevated ? 'var(--bg-press)' : 'var(--bg-hover)'};
  }

  &.active {
    background: ${params.elevated ? 'var(--bg-press)' : 'var(--bg-hover)'};
    color: var(--fg);
    font-weight: var(--font-weight-medium);
  }

  &:active {
    background: var(--color-gray-150);
  }
`;

const outline: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  justify-content: center;
  border: 1px solid var(--border);
  color: var(--fg);

  &:hover {
    background: var(--bg-press);
  }

  &.active {
    background: var(--bg-hover);
  }

  &.active:hover {
    background: var(--bg-press);
  }
`;

const outlineMuted: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
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
`;

const primary: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  justify-content: center;
  background: var(--color-primary-600);
  color: var(--primary-contrast-text);

  &:hover {
    background: var(--color-primary-700);
  }
`;

const destructive: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  justify-content: center;
  background: var(--color-red-500);
  color: var(--white);

  &:hover {
    background: var(--color-red-600);
  }
`;

const destructiveSoft: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  justify-content: center;
  background: var(--color-red-100);
  color: var(--color-red-700);

  &:hover {
    background: var(--color-red-200);
  }
`;

const menu: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  border-radius: var(--radius-lg);
  color: var(--fg);
  flex-shrink: 0;
  justify-content: flex-start;
  position: relative;
  width: 100%;

  &:hover {
    background: var(--bg-hover);
  }

  &:active {
    background: var(--bg-press);
  }

  &:focus-visible {
    outline: none;
  }
`;

const menuDestructive: VariantStyleFn = (params) => css`
  ${menu(params)}
  color: var(--color-red-400);

  &:hover {
    background: var(--bg-hover);
  }

  &:active {
    background: var(--bg-press);
  }

  &:focus-visible {
    outline: none;
  }
`;

const nav: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  border-radius: var(--radius-lg);
  color: var(--fg);
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
  }
`;

const link: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  justify-content: center;
  color: var(--primary);

  &:hover {
    background: var(--bg-hover);
  }

  &:active {
    background: var(--bg-press);
  }
`;

export const variantsStyles: Record<ButtonVariant, VariantStyleFn> = {
  default: defaultVariant,
  destructive,
  'destructive-soft': destructiveSoft,
  ghost,
  link,
  menu,
  'menu-destructive': menuDestructive,
  muted,
  nav,
  outline,
  'outline-muted': outlineMuted,
  primary,
  unstyled,
};
