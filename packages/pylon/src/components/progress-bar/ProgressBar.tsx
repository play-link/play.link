import type {HTMLAttributes} from 'react';
import {styled} from 'styled-components';

export type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';

export type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  /** Progress value from 0-100 */
  value: number;
  /** Color variant */
  variant?: ProgressBarVariant;
  /** Maximum value (defaults to 100) */
  max?: number;
};

export function ProgressBar({
  value,
  variant = 'primary',
  max = 100,
  ...restProps
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <Track
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...restProps}
    >
      <Fill $pct={pct} $variant={variant} />
    </Track>
  );
}

const Track = styled.div`
  background: var(--bg-muted);
  border-radius: var(--radius-full);
  height: 0.5rem;
  overflow: hidden;
  width: 100%;
`;

const Fill = styled.div<{$pct: number; $variant: ProgressBarVariant}>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$variant === 'primary' ? 'var(--primary)' : `var(--fg-${p.$variant})`)};
  border-radius: inherit;
  transition: width 0.2s ease-out;
`;
