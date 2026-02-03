import type {PropsWithChildren} from 'react';
import styled from 'styled-components';
import {toClassName} from '../../style';

export type TabNavProps = PropsWithChildren<{
  bleeding?: number;
  className?: string;
}> &
  React.HTMLAttributes<HTMLDivElement>;

export type TabNavItemProps = PropsWithChildren<{
  active?: boolean;
  className?: string;
}> &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export function TabNav({children, bleeding, className, ...restProps}: TabNavProps) {
  const style = bleeding
    ? ({
        '--tab-nav-bleeding': `var(--spacing-${bleeding})`,
        ...restProps.style,
      } as React.CSSProperties)
    : restProps.style;

  return (
    <StyledTabNav
      className={toClassName({bleeding: !!bleeding}, className)}
      {...restProps}
      style={style}
    >
      {children}
    </StyledTabNav>
  );
}

export function TabNavItem({children, active = false, className, ...restProps}: TabNavItemProps) {
  return (
    <StyledTabNavItem className={toClassName({active}, className)} {...restProps}>
      <span className="tab-label">{children}</span>
    </StyledTabNavItem>
  );
}

const StyledTabNav = styled.div`
  display: flex;
  gap: var(--spacing-1);
  border-bottom: 1px solid var(--border-subtle);

  &.bleeding {
    margin-left: calc(-1 * var(--tab-nav-bleeding));
    margin-right: calc(-1 * var(--tab-nav-bleeding));
    padding-left: var(--tab-nav-bleeding);
    padding-right: var(--tab-nav-bleeding);
  }
`;

const StyledTabNavItem = styled.button`
  all: unset;
  position: relative;
  cursor: pointer;
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-3);
  margin-bottom: -1px;
  color: var(--fg-subtle);
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease;

  &:hover {
    color: var(--fg);
  }

  &:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: -2px;
    border-radius: var(--radius-md);
  }

  .tab-label {
    position: relative;
  }

  &.active {
    color: var(--fg);
    border-bottom-color: var(--fg);

    .tab-label::after {
      content: '';
      position: absolute;
      inset: calc(-1 * var(--spacing-1)) calc(-1 * var(--spacing-2));
      background: var(--bg-muted);
      border-radius: var(--radius-lg);
      z-index: -1;
    }
  }
`;
