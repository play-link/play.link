import type {HTMLAttributes} from 'react';
import {styled} from 'styled-components';

export type ProgressBarVariant = 'success' | 'warning' | 'error' | 'info';

export type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  max: number;
  value: number;
  variant: ProgressBarVariant;
  width: number | string;
};

export function ProgressBar({max, value, variant, width, ...restProps}: ProgressBarProps) {
  const pct = (value / max) * 100;

  return (
    <Root
      $pct={pct}
      $variant={variant}
      style={{width}}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...restProps}
    >
      <div />
    </Root>
  );
}

const Root = styled.div<{$pct: number; $variant: ProgressBarVariant}>`
  background: var(--border-deep);
  border-radius: var(--radius-full);
  height: 0.25rem;
  overflow: hidden;

  div {
    height: 100%;
    width: ${(p) => p.$pct}%;
    background: ${(p) => `var(--fg-${[p.$variant]})`};
  }
`;
