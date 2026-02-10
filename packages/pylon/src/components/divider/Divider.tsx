import {css, styled} from 'styled-components';
import type {Spacing} from '../../style';

export interface DividerProps {
  direction?: 'row' | 'column';
  variant?: 'soft' | 'subtle';
  className?: string;
  bleed?: Spacing;
  inset?: Spacing;
}

export function Divider({direction, bleed, inset, variant = 'subtle', ...restProps}: DividerProps) {
  if (direction === 'row') {
    return <DividerRow $variant={variant} {...restProps} />;
  }

  return <DividerCol $bleed={bleed} $inset={inset} $variant={variant} {...restProps} />;
}

const DividerRow = styled.div<{$variant?: 'soft' | 'subtle'}>`
  width: 0.0625rem;
  height: 100%;
  background: ${(props) =>
    props.$variant === 'soft' ? 'var(--border-muted)' : 'var(--border-subtle)'};
`;

const DividerCol = styled.div<{
  $bleed?: Spacing;
  $inset?: Spacing;
  $variant?: 'soft' | 'subtle';
}>`
  height: 0.0625rem;
  background: ${(props) =>
    props.$variant === 'soft' ? 'var(--border-muted)' : 'var(--border-subtle)'};

  ${(props) =>
    props.$bleed
      ? css`
          margin-left: calc(var(--spacing-${props.$bleed}) * -1);
          width: calc(100% + var(--spacing-${props.$bleed}) * 2);
        `
      : props.$inset
        ? css`
            margin-left: var(--spacing-${props.$inset});
            width: calc(100% - var(--spacing-${props.$inset}) * 2);
          `
        : css`
            width: 100%;
          `}
`;
