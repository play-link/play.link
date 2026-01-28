import {css} from 'styled-components';
import type {RuleSet} from 'styled-components';

export const BUTTON_VARIANTS = [
  'default',
  'destructive',
  'destructive-soft',
  'ghost',
  'link',
  'menu',
  'menu-destructive',
  'muted',
  'nav',
  'outline',
  'outline-muted',
  'primary',
  'unstyled',
  'warning',
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
  useInputVariables?: boolean;
}

type VariantStyleFn = (params: VariantParams) => RuleSet<object>;

// Base styles shared across most variants
const baseStyles = ({size, autoHeight, fullRounded, useInputVariables = false}: VariantParams) => {
  const prefix = useInputVariables ? 'input' : 'button';

  return css`
    border-radius: ${fullRounded ? 'var(--radius-full)' : `var(--${prefix}-radius-${size})`};
    height: ${autoHeight ? 'auto' : `var(--${prefix}-height-${size})`};
    padding: var(--${prefix}-padding-${size});
    transition:
      background-color 0.15s linear,
      color 0.15s linear;
  `;
};

const centeredContent = css`
  justify-content: center;
`;

// Variant definitions
const unstyled: VariantStyleFn = () => css``;

const defaultVariant: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  background: var(--fg-body);
  color: var(--bg-body);

  &:hover {
    background: var(--color-gray-800);
  }
`;

const muted: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  background: ${params.elevated ? 'var(--bg-deepest)' : 'var(--bg-deep)'};
  color: var(--fg-body);

  &:hover {
    background: var(--border-deep);
  }

  &.active {
    background: var(--border-deep);
    color: var(--fg-body);
  }
`;

const ghost: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  
  color: ${params.emphasis ? 'var(--fg-body)' : 'var(--fg-subtle)'};

  &:hover {
    color: var(--fg-body);
    background: ${params.elevated ? 'var(--bg-deep)' : 'var(--bg-subtle)'};
  }

  &.active {
    background: ${params.elevated ? 'var(--bg-deep)' : 'var(--bg-subtle)'};
    color: var(--fg-body);
    font-weight: var(--font-weight-medium);
  }

  &:active {
    background: var(--color-gray-150);
  }
`;

const outline: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  border: 1px solid var(--border-deep);
  color: var(--fg-body);

  &:hover {
    background: var(--bg-deep);
  }

  &.active {
    background: var(--bg-subtle);
  }

  &.active:hover {
    background: var(--bg-deep);
  }
`;

const outlineMuted: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  border: 1px solid var(--border-deep);
  color: var(--fg-muted);

  &:hover {
    background: var(--bg-deep);
  }

  &.active {
    color: var(--fg-body);
    border-color: var(--fg-body);
  }
`;

const primary: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  background: var(--primary-bg);
  color: var(--primary-contrast-text);

  &:hover {
    background: var(--primary-bg-hover);
  }
`;

const warning: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  background: var(--color-orange-600);
  color: var(--white);

  &:hover {
    background: var(--color-orange-700);
  }
`;

const destructive: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  background: var(--color-red-600);
  color: var(--white);

  &:hover {
    background: var(--color-red-700);
  }
`;

const destructiveSoft: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  background: var(--color-red-50);
  color: var(--color-red-500);

  &:hover {
    background: var(--color-red-100);
  }
`;

const menu: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  border-radius: var(--radius-lg);
  color: var(--fg-body);
  flex-shrink: 0;
  justify-content: flex-start;
  position: relative;
  width: 100%;

  &.hover,
  &:hover {
    background: var(--bg-deep);
  }

  &:focus-visible {
    outline: none;
  }

  &.selected {
    font-weight: var(--font-weight-medium);
  }
`;

const menuDestructive: VariantStyleFn = (params) => css`
  ${menu(params)}
  color: var(--color-red-500);

  &:hover {
    background: var(--color-red-50);
    color: var(--color-red-500);
  }
`;

const nav: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  border-radius: var(--radius-lg);
  color: var(--fg-body);
  flex-shrink: 0;
  justify-content: flex-start;
  padding: 0 var(--spacing-3);
  transition: background 0.1s ease;

  &:hover {
    background: var(--bg-deep);
  }

  &.active,
  &.opened {
    background: var(--bg-deep);
  }

  &:active {
    background: var(--bg-deepest);
  }
`;

const link: VariantStyleFn = (params) => css`
  ${baseStyles(params)}
  ${centeredContent}
  color: var(--primary);

  &:hover {
    background: var(--primary-bg-soft);
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
  warning,
};
