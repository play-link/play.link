import type {HTMLAttributes} from 'react';
import styled from 'styled-components';

export type BadgeIntent = 'info' | 'success' | 'error' | 'warning';
export type BadgeTone = 'solid' | 'dark' | 'outline';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  /** The semantic intent/color of the badge */
  intent?: BadgeIntent;
  /** The visual tone/style of the badge */
  tone?: BadgeTone;
  /** Size of the badge */
  size?: BadgeSize;
  /** Show a dot indicator */
  dot?: boolean;
};

export function Badge({
  children,
  intent = 'info',
  tone = 'solid',
  size = 'md',
  dot = false,
  ...restProps
}: BadgeProps) {
  const styles = getStyles(intent, tone);

  return (
    <StyledBadge $styles={styles} $size={size} {...restProps}>
      {dot && <Dot $color={styles.color} />}
      {children}
    </StyledBadge>
  );
}

type BadgeStyles = {
  background: string;
  color: string;
  border?: string;
};

function getStyles(intent: BadgeIntent, tone: BadgeTone): BadgeStyles {
  const intentColors = {
    info: {
      base: 'var(--info)',
      dark: 'var(--info-dark)',
      text: 'var(--info-contrast-text)',
      darkText: 'var(--info-dark-contrast-text)',
    },
    success: {
      base: 'var(--success)',
      dark: 'var(--success-dark)',
      text: 'var(--success-contrast-text)',
      darkText: 'var(--success-dark-contrast-text)',
    },
    error: {
      base: 'var(--error)',
      dark: 'var(--error-dark)',
      text: 'var(--error-contrast-text)',
      darkText: 'var(--error-dark-contrast-text)',
    },
    warning: {
      base: 'var(--warning)',
      dark: 'var(--warning-dark)',
      text: 'var(--warning-contrast-text)',
      darkText: 'var(--warning-dark-contrast-text)',
    },
  };

  const colors = intentColors[intent];

  switch (tone) {
    case 'dark':
      return {
        background: colors.dark,
        color: colors.darkText,
      };
    case 'outline':
      return {
        background: 'var(--bg-surface)',
        color: colors.text,
        border: colors.text,
      };
    default: // solid
      return {
        background: colors.base,
        color: colors.text,
      };
  }
}

const sizeStyles = {
  sm: {
    height: 'var(--spacing-5)',
    padding: '0 var(--spacing-2)',
    gap: 'var(--spacing-1)',
    fontSize: 'var(--text-xs)',
  },
  md: {
    height: 'var(--button-height-xs)',
    padding: '0 var(--spacing-2-5)',
    gap: 'var(--spacing-1-5)',
    fontSize: 'var(--text-sm)',
  },
};

const StyledBadge = styled.div<{$styles: BadgeStyles; $size: BadgeSize}>`
  align-items: center;
  background: ${(p) => p.$styles.background};
  border-radius: var(--radius-full);
  color: ${(p) => p.$styles.color};
  cursor: default;
  display: inline-flex;
  font-weight: 500;
  white-space: nowrap;

  /* Size styles */
  height: ${(p) => sizeStyles[p.$size].height};
  padding: ${(p) => sizeStyles[p.$size].padding};
  gap: ${(p) => sizeStyles[p.$size].gap};
  font-size: ${(p) => sizeStyles[p.$size].fontSize};

  ${(p) => p.$styles.border && `border: 1px solid ${p.$styles.border}`};
`;

const Dot = styled.div<{$color: string}>`
  background: ${(p) => p.$color};
  border-radius: 50%;
  flex-shrink: 0;
  height: 0.375rem;
  width: 0.375rem;
`;
