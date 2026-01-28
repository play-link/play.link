import {AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {PropsWithChildren} from 'react';
import styled from 'styled-components';
import {Icon} from '../icon';
import {IconButton} from '../icon-button';
import {Prose} from '../prose';

export type Severity = 'success' | 'info' | 'warning' | 'error';

type ToastProps = PropsWithChildren<{
  className?: string;
  onClickClose?: () => void;
  severity?: Severity;
  noIcon?: boolean;
}>;

export function Toast({
  children,
  className,
  onClickClose,
  severity = 'info',
  noIcon = false,
  ...props
}: ToastProps) {
  const {Icon: SeverityIcon} = stylesMap[severity];
  const hasIcon = SeverityIcon && !noIcon;
  const hasCloseButton = !!onClickClose;

  return (
    <Root className={className} $severity={severity} {...props}>
      <ToastContent>
        {hasIcon && SeverityIcon && (
          <IconWrapper>
            <Icon icon={SeverityIcon} />
          </IconWrapper>
        )}
        <Prose className="font-medium flex-1">{children}</Prose>
        {hasCloseButton && (
          <CloseButtonWrapper>
            <IconButton aria-label="Close" variant="unstyled" size="sm" onClick={onClickClose}>
              <Icon icon={XIcon} size={18} />
            </IconButton>
          </CloseButtonWrapper>
        )}
      </ToastContent>
    </Root>
  );
}

const stylesMap: {
  [key: string]: {
    bgColor: string;
    color: string;
    Icon?: LucideIcon;
  };
} = {
  info: {
    bgColor: 'var(--info)',
    color: 'var(--info-contrast-text)',
    Icon: InfoIcon,
  },
  warning: {
    bgColor: 'var(--warning)',
    color: 'var(--warning-contrast-text)',
    Icon: AlertTriangleIcon,
  },
  error: {
    bgColor: 'var(--error)',
    color: 'var(--error-contrast-text)',
    Icon: AlertTriangleIcon,
  },
  success: {
    bgColor: 'var(--success)',
    color: 'var(--success-contrast-text)',
    Icon: CheckCircleIcon,
  },
};

const Root = styled.div<{$severity: Severity}>`
  background: ${(p) => stylesMap[p.$severity].bgColor};
  border-radius: var(--radius-md);
  color: ${(p) => stylesMap[p.$severity].color};
  padding: var(--spacing-2-5) var(--spacing-3);
  position: relative;
  width: 100%;
`;

const ToastContent = styled.div`
  align-items: flex-start;
  display: flex;
  gap: var(--spacing-2-5);
`;

const IconWrapper = styled.div`
  display: inline-flex;
  flex-shrink: 0;
`;

const CloseButtonWrapper = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  margin-left: auto;
`;
