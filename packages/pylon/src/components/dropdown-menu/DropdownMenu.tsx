import type {MouseEvent, ReactNode} from 'react';
import {cloneElement, isValidElement, useRef, useState} from 'react';
import styled from 'styled-components';
import {dropdownOverlayCss} from '../../style';
import type {OverlayPosition, OverlayProps} from '../overlay';
import {Overlay} from '../overlay';

interface Props {
  children: ReactNode[];
  closeOnClickSelectors?: string[];
  mode?: 'click' | 'hover' | 'mousedown';
  overlayPosition?: Omit<OverlayPosition, 'positionTarget'>;
  overlayProps?: Omit<OverlayProps, 'children' | 'opened' | 'position' | 'setOpened'>;
}

const DEFAULT_CLOSE_ON_CLICK_SELECTORS = ['button', 'a'];
const DEFAULT_OVERLAY_PROPS = {};

export function DropdownMenu({
  children,
  closeOnClickSelectors = DEFAULT_CLOSE_ON_CLICK_SELECTORS,
  mode = 'click',
  overlayPosition,
  overlayProps = DEFAULT_OVERLAY_PROPS,
}: Props) {
  const closeTimeout = useRef<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [opened, setOpened] = useState(false);

  // Event handlers for hover/click/mousedown
  const handleTriggerMouseEnter = () => {
    if (mode === 'hover') setOpened(true);
  };

  const handleTriggerMouseLeave = () => {
    if (mode === 'hover') {
      closeTimeout.current = window.setTimeout(() => setOpened(false), 100);
    }
  };

  const handleOverlayMouseEnter = () => {
    if (mode === 'hover' && closeTimeout.current) {
      window.clearTimeout(closeTimeout.current);
    }
  };

  const handleOverlayMouseLeave = () => {
    if (mode === 'hover') {
      closeTimeout.current = window.setTimeout(() => setOpened(false), 100);
    }
  };

  const handleTriggerMouseDown = (evt: MouseEvent<HTMLElement>) => {
    if (mode === 'mousedown') {
      evt.preventDefault();
      setOpened((prev) => !prev);
    }
  };

  const handleTriggerClick = (evt: MouseEvent<HTMLElement>) => {
    if (mode === 'click') {
      evt.preventDefault();
      evt.stopPropagation();
      setOpened((prev) => !prev);
    }
  };

  const handleOverlayClick = (evt: MouseEvent<HTMLElement>) => {
    if (!closeOnClickSelectors.length) return;
    let node: Element | null = evt.target as Element;
    while (node) {
      if (closeOnClickSelectors.some((sel) => node?.matches?.(sel))) {
        setOpened(false);
        break;
      }
      node = node.parentElement;
    }
  };

  // First child is the trigger; clone it to inject props/handlers
  const triggerElement = Array.isArray(children) ? children[0] : null;
  let clonedTrigger = triggerElement;

  if (isValidElement(triggerElement)) {
    // Merge user’s existing props (onClick, onMouseEnter, etc.) with ours
    const userProps = triggerElement.props as any;
    // eslint-disable-next-line react/no-clone-element
    clonedTrigger = cloneElement(triggerElement as React.ReactElement<any>, {
      ref: triggerRef,
      tabIndex: 0,
      role: 'button',
      'data-opened': opened,
      'aria-expanded': opened,
      'aria-controls': 'dropdown-menu',
      style: userProps.style,
      className: userProps.className + (opened ? ' opened' : ''),
      onMouseEnter: (e: MouseEvent<HTMLElement>) => {
        userProps.onMouseEnter?.(e);
        handleTriggerMouseEnter();
      },
      onMouseLeave: (e: MouseEvent<HTMLElement>) => {
        userProps.onMouseLeave?.(e);
        handleTriggerMouseLeave();
      },
      onMouseDown: (e: MouseEvent<HTMLElement>) => {
        userProps.onMouseDown?.(e);
        handleTriggerMouseDown(e);
      },
      onClick: (e: MouseEvent<HTMLElement>) => {
        userProps.onClick?.(e);
        handleTriggerClick(e);
      },
    });
  }

  return (
    <>
      {clonedTrigger}
      <StyledOverlay
        triggerRef={triggerRef}
        opened={opened}
        setOpened={setOpened}
        position={{
          positionTarget: triggerRef.current,
          fitToScreen: true,
          ...overlayPosition,
        }}
        cancelOnEscKey
        cancelOnOutsideClick
        disableBodyScroll
        {...overlayProps}
      >
        <OverlayContent
          id="dropdown-menu"
          role="menu"
          onMouseEnter={handleOverlayMouseEnter}
          onMouseLeave={handleOverlayMouseLeave}
          onClick={handleOverlayClick}
        >
          {/* Everything after the first child is the dropdown content */}
          {Array.isArray(children) ? children.slice(1) : null}
        </OverlayContent>
      </StyledOverlay>
    </>
  );
}

const StyledOverlay = styled(Overlay)`
  ${dropdownOverlayCss}
`;

const OverlayContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;
