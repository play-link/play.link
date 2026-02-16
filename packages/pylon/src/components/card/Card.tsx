import type {PropsWithChildren} from 'react';
import styled, {css} from 'styled-components';
import {toClassName} from '../../style';

export type CardVariant = 'default' | 'warning' | 'error' | 'muted';

/**
 * Card padding configuration.
 * Uses spacing scale values (0-10) that map to --spacing-X CSS variables.
 *
 * @example
 * padding={5}              // all sides: 5
 * padding={0}              // no padding
 * padding={[5, 0]}         // vertical: 5, horizontal: 0
 * padding={[5, 4, 0, 4]}   // top: 5, right: 4, bottom: 0, left: 4
 */
export type CardPadding = number | [number, number] | [number, number, number, number];

export type CardProps = PropsWithChildren<{
  className?: string;
  /** Card padding using spacing scale values */
  padding?: CardPadding;
  variant?: CardVariant;
  scrollable?: boolean;
}> &
  React.HTMLAttributes<HTMLDivElement>;

export function Card({
  children,
  className,
  padding = 4,
  scrollable = false,
  variant = 'default',
  ...restProps
}: CardProps) {
  const paddingValue = resolvePadding(padding);

  return (
    <StyledRoot
      className={toClassName(
        {
          'variant-warning': variant === 'warning',
          'variant-error': variant === 'error',
          'variant-muted': variant === 'muted',
        },
        className,
      )}
      $padding={paddingValue}
      $scrollable={scrollable}
      {...restProps}
    >
      {children}
    </StyledRoot>
  );
}

const StyledRoot = styled.div<{
  $padding: string;
  $scrollable: boolean;
}>`
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  border: 0.0625rem solid var(--border-muted);
  overflow: hidden;
  padding: ${({$padding}) => $padding};

  ${({$scrollable}) =>
    $scrollable &&
    css`
      max-height: 100%;
      overflow: auto;
    `}

  &.variant-warning {
    border-color: var(--color-amber-200);
    background-color: var(--color-amber-50);
  }

  &.variant-error {
    border-color: var(--color-red-50);
    background-color: var(--color-red-50);
  }

  &.variant-muted {
    border-color: var(--bg-muted);
    background-color: var(--bg-muted);
  }
`;

// --- Helpers ---

function toSpacing(value: number): string {
  return value === 0 ? '0' : `var(--spacing-${value})`;
}

function resolvePadding(padding: CardPadding): string {
  if (typeof padding === 'number') {
    return toSpacing(padding);
  }

  if (padding.length === 2) {
    const [vertical, horizontal] = padding;
    return `${toSpacing(vertical)} ${toSpacing(horizontal)}`;
  }

  if (padding.length === 4) {
    const [top, right, bottom, left] = padding;
    return `${toSpacing(top)} ${toSpacing(right)} ${toSpacing(bottom)} ${toSpacing(left)}`;
  }

  return toSpacing(5);
}
