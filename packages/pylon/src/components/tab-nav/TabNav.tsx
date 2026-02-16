import type {LucideIcon} from 'lucide-react';
import {useEffect, useRef} from 'react';
import {NavLink} from 'react-router';
import {css, styled} from 'styled-components';
import {mediaQuery, toClassName} from '../../style';
import {renderIcon} from '../icon';

export interface TabNavItem {
  /** Route path (use for routing tabs) */
  to?: string;
  /** Click handler (use for clickable tabs) */
  onClick?: () => void;
  /** Whether this tab is active (required when using onClick) */
  isActive?: boolean;
  /** Tab label */
  label: string;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Optional count badge */
  count?: number;
  /** Whether to use exact match for active state (only for routing tabs) */
  end?: boolean;
}

interface TabNavProps {
  items: TabNavItem[];
  className?: string;
  /** Bleed amount to ignore parent padding (uses spacing scale) */
  bleed?: number;
}

/**
 * Horizontal tab navigation with underline style.
 * Active tab has a darker border-bottom.
 *
 * Supports two modes:
 * 1. Routing: Use `to` prop for NavLink navigation
 * 2. Clickable: Use `onClick` and `isActive` for local state
 *
 * @example
 * // Routing mode
 * <TabNav
 *   items={[
 *     {to: '/drafts', label: 'Drafts', icon: 'plane', count: 5},
 *     {to: '/pending', label: 'For approval', count: 2},
 *   ]}
 * />
 *
 * // Clickable mode
 * <TabNav
 *   scrollable
 *   items={specs.map((spec, idx) => ({
 *     onClick: () => setActiveIndex(idx),
 *     isActive: idx === activeIndex,
 *     label: spec.shortCode,
 *     icon: 'plane',
 *     count: spec.trips.length,
 *   }))}
 * />
 */
export function TabNav({items, className, bleed}: TabNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const nav = navRef.current;
    const el = indicatorRef.current;
    if (!nav || !el) return;

    const active = nav.querySelector('.active') as HTMLElement | null;
    if (!active) {
      el.style.opacity = '0';
      return;
    }

    const left = active.offsetLeft;
    const width = active.offsetWidth;

    if (isFirstRender.current) {
      el.style.transition = 'none';
      isFirstRender.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (indicatorRef.current) {
            indicatorRef.current.style.transition = '';
          }
        });
      });
    }

    el.style.left = `${left}px`;
    el.style.width = `${width}px`;
    el.style.opacity = '1';
  });

  return (
    <Nav className={className} $bleed={bleed} ref={navRef}>
      {items.map((item) => {
        const content = (
          <TabContent>
            {item.icon && renderIcon(item.icon, 16)}
            {item.label}
            {item.count !== undefined && <Count>{item.count}</Count>}
          </TabContent>
        );

        // Clickable mode (button)
        if (item.onClick) {
          return (
            <TabButton
              key={item.label}
              onClick={item.onClick}
              className={toClassName({active: item.isActive ?? false})}
            >
              {content}
            </TabButton>
          );
        }

        // Routing mode (NavLink)
        return (
          <TabLink key={item.to} to={item.to!} end={item.end}>
            {content}
          </TabLink>
        );
      })}
      {/* <Indicator ref={indicatorRef} /> */}
    </Nav>
  );
}

const Nav = styled.nav<{$bleed?: number}>`
  display: flex;
  gap: var(--spacing-6);
  position: relative;
  padding: 0 var(--spacing-3);

  border-radius: var(--radius-2xl);
  background: var(--dashboard-layout-sidebar-bg);

  /* Hide scrollbar */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  /* Bleed: expand nav to ignore parent's horizontal padding */
  ${({$bleed}) =>
    typeof $bleed === 'number' &&
    css`
      margin-left: calc(var(--spacing-${$bleed}) * -1);
      margin-right: calc(var(--spacing-${$bleed}) * -1);
      padding-left: var(--spacing-${$bleed});
      padding-right: var(--spacing-${$bleed});
    `}
`;

const tabStyles = css`
  align-items: center;
  border-bottom: 2px solid transparent;
  color: var(--fg-subtle);
  display: flex;
  flex-shrink: 0;
  padding: var(--spacing-3) 0 var(--spacing-3);
  position: relative;
  white-space: nowrap;

  &:hover {
    color: var(--fg);
  }

  ${mediaQuery(
    'md>',
    css`
      &:hover:before {
        content: '';
        background-color: var(--bg-hover);
        border-radius: var(--radius-xl);
        position: absolute;
        top: 5px;
        left: -0.5rem;
        right: -0.5rem;
        z-index: 0;
        bottom: 5px;
      }
    `,
  )}

  ${mediaQuery(
    '<md',
    css`
      font-weight: var(--font-weight-medium);
    `,
  )}

  &.active {
    color: var(--fg);
  }

  &.active:before {
    content: '';
    background-color: var(--bg-hover);
    border-radius: var(--radius-lg);
    position: absolute;
    top: 5px;
    left: -0.5rem;
    right: -0.5rem;
    z-index: 0;
    bottom: 5px;
  }
`;

const TabContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  position: relative;
  z-index: 1;
`;

const TabLink = styled(NavLink)`
  ${tabStyles}
  text-decoration: none;
`;

const TabButton = styled.button`
  all: unset;
  cursor: pointer;
  ${tabStyles}
`;

const Count = styled.span`
  color: var(--fg-muted);
  font-size: var(--text-xs);
`;
