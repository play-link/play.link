import {css, styled} from 'styled-components';
import type {Spacing} from '../../style';

export interface DividerProps {
  direction?: 'row' | 'column';
  variant?: 'soft' | 'subtle';
  className?: string;
  bleedSpacing?: Spacing;
}

export function Divider({direction, bleedSpacing, variant = 'soft', ...restProps}: DividerProps) {
  if (direction === 'row') {
    return <DividerRow $variant={variant} {...restProps} />;
  }

  return <DividerCol $bleedSpacing={bleedSpacing} $variant={variant} {...restProps} />;
}

const DividerRow = styled.div<{$variant?: 'soft' | 'subtle'}>`
  width: 0.0625rem;
  height: 100%;
  background: ${(props) =>
    props.$variant === 'soft' ? 'var(--border-soft)' : 'var(--border-subtle)'};
`;

const DividerCol = styled.div<{
  $bleedSpacing?: Spacing;
  $variant?: 'soft' | 'subtle';
}>`
  height: 0.0625rem;
  background: ${(props) =>
    props.$variant === 'soft' ? 'var(--border-soft)' : 'var(--border-subtle)'};

  ${(props) =>
    props.$bleedSpacing
      ? css`
          margin-left: calc(var(--spacing-${props.$bleedSpacing}) * -1);
          width: calc(100% + var(--spacing-${props.$bleedSpacing}) * 2);
        `
      : css`
          width: 100%;
        `}
`;
