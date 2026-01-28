import {XIcon} from 'lucide-react';
import type {ReactNode} from 'react';
import styled, {keyframes} from 'styled-components';
import {Icon} from '../icon';
import type {SnackbarSeverity} from './SnackbarContext';

export interface SnackbarItemProps {
  children: ReactNode;
  severity: SnackbarSeverity;
  onDismiss?: () => void;
}

/**
 * The visual snackbar item component used by both SnackbarContainer
 * (for stacking snackbars) and can be used standalone.
 */
export function SnackbarItem({children, severity, onDismiss}: SnackbarItemProps) {
  const {bgColor, color} = styleMap[severity];

  return (
    <Root $bgColor={bgColor} $color={color} role="alert" aria-live="polite">
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <CloseButton onClick={onDismiss} aria-label="Dismiss">
          <Icon icon={XIcon} size={16} strokeWidth={2} />
        </CloseButton>
      )}
    </Root>
  );
}

const styleMap: Record<SnackbarSeverity, {bgColor: string; color: string}> = {
  success: {
    bgColor: 'var(--success)',
    color: 'var(--success-contrast-text)',
  },
  info: {
    bgColor: 'var(--info)',
    color: 'var(--info-contrast-text)',
  },
  warning: {
    bgColor: 'var(--warning)',
    color: 'var(--warning-contrast-text)',
  },
  error: {
    bgColor: 'var(--error)',
    color: 'var(--error-contrast-text)',
  },
};

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Root = styled.div<{
  $bgColor: string;
  $color: string;
}>`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: ${(p) => p.$bgColor};
  color: ${(p) => p.$color};
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  pointer-events: all;
  width: 100%;
  max-width: 21.875rem;
  animation: ${slideIn} 0.2s ease-out;
  font-weight: var(--font-weight-medium);
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 0;
  flex-shrink: 0;

  &:hover {
    filter: brightness(0.9);
  }
`;
