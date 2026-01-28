import type {MouseEvent, ReactNode, RefObject} from 'react';
import {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {scrollIntoView} from '../../lib';
import {useListNavigation} from '../../lib/use-list-navigation';

export type NavigationListProps = {
  children: ReactNode;
  externalEventTargetRef?: RefObject<HTMLElement | null>;
  targetSelectors?: string;
  noAutoFocus?: boolean;
  initialFocusedIndex?: number | null;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * NavigationList - A wrapper component that adds keyboard navigation behavior to lists of interactive elements.
 *
 * This component provides arrow key navigation, mouse hover tracking, and keyboard activation
 * for lists of buttons, links, or other focusable elements. It's commonly used in dropdown menus,
 * navigation menus, and other interactive lists.
 *
 * Key Features:
 * - Arrow Up/Down navigation between focusable elements
 * - Mouse hover tracking with visual feedback via 'hover' CSS class
 * - Enter/Space key activation of focused elements
 * - Tab key to focus first element when none are focused
 * - Support for external event targets (e.g., dropdown triggers)
 * - Automatic scrolling of focused elements into view
 * - Initial focus index support
 * - Automatic focus management
 *
 * How it works:
 * 1. Queries for focusable elements using targetSelectors (default: 'button, a')
 * 2. Tracks focused index state and mouse vs keyboard interaction mode
 * 3. Handles keyboard events (arrows, enter, space, tab) for navigation and activation
 * 4. Handles mouse events to update focus and add hover classes
 * 5. Manages visual feedback by adding/removing 'hover' CSS class on elements
 * 6. Supports external event targets for scenarios like dropdown menus
 *
 * Usage:
 * ```tsx
 * <NavigationList>
 *   <Button>Item 1</Button>
 *   <Button>Item 2</Button>
 *   <Button>Item 3</Button>
 * </NavigationList>
 * ```
 *
 * @param children - React children containing focusable elements
 * @param externalEventTargetRef - Optional ref to external element that should handle keyboard events
 * @param targetSelectors - CSS selector string for focusable elements (default: 'button, a')
 * @param noAutoFocus - Disable automatic focus on mount (default: false)
 * @param initialFocusedIndex - Set initial focused element index (default: null)
 */
export function NavigationList({
  children,
  noAutoFocus = false,
  externalEventTargetRef,
  targetSelectors = 'button, a',
  initialFocusedIndex = null,
  ...props
}: NavigationListProps) {
  const elemsRef = useRef<HTMLElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusableCount, setFocusableCount] = useState(0);
  const lastInteraction = useRef<'mouse' | 'keyboard'>('mouse');
  const {focusedIdx, setFocusedIdx, handleArrowNavigation} = useListNavigation(focusableCount);

  // Set initial focused index
  useEffect(() => {
    if (initialFocusedIndex !== null && initialFocusedIndex < focusableCount) {
      setFocusedIdx(initialFocusedIndex);
    }
  }, [initialFocusedIndex, focusableCount, setFocusedIdx]);

  // Focus container on mount
  useEffect(() => {
    if (containerRef.current && !noAutoFocus && !externalEventTargetRef?.current) {
      containerRef.current.focus({preventScroll: true});
    }
  }, [noAutoFocus, externalEventTargetRef]);

  // Effect to attach keydown listener to external target
  useEffect(() => {
    const externalTarget = externalEventTargetRef?.current;

    // Wrapper to handle native KeyboardEvent and call React handler
    const handleExternalKeyDown = (ev: KeyboardEvent) => {
      // Check if the key is one we care about for navigation
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
        // Create a React-compatible keyboard event object
        const reactEvent = {
          key: ev.key,
          preventDefault: () => ev.preventDefault(),
          stopPropagation: () => ev.stopPropagation(),
          currentTarget: ev.currentTarget,
          target: ev.target,
        } as React.KeyboardEvent;

        lastInteraction.current = 'keyboard';
        handleArrowNavigation(reactEvent);
        // Stop the event from propagating further (e.g., to the container's listener)
        ev.stopPropagation();
      }
      // Handle Tab to focus first element when no item is focused
      else if (ev.key === 'Tab') {
        ev.preventDefault();
        ev.stopPropagation();
        setFocusedIdx(0);
      }
      // Handle Enter and Tab for activation when there's a focused item
      else if (ev.key === 'Enter' && focusedIdx !== null) {
        ev.preventDefault();
        ev.stopPropagation();
        const focusedElement = elemsRef.current[focusedIdx];
        if (focusedElement) {
          // Create and dispatch a click event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          focusedElement.dispatchEvent(clickEvent);
        }
      }
    };

    if (externalTarget) {
      externalTarget.addEventListener('keydown', handleExternalKeyDown);
      // Cleanup function to remove the listener
      return () => {
        externalTarget.removeEventListener('keydown', handleExternalKeyDown);
      };
    }
    // No cleanup needed if no external target
    return undefined;
  }, [externalEventTargetRef, handleArrowNavigation, focusedIdx, setFocusedIdx, elemsRef]); // Rerun if ref or handler changes

  // Update focusable count whenever children or selectors change.
  useEffect(() => {
    if (containerRef.current) {
      const elements = Array.from(
        containerRef.current.querySelectorAll(targetSelectors),
      ) as HTMLElement[];
      elemsRef.current = elements;

      setFocusableCount(elements.length);
    }
  }, [children, targetSelectors]);

  // Update focused index based on mouse movement.
  const handleMouseMove = (evt: MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    // Use closest() to find the nearest focusable element.
    const targetElement = (evt.target as HTMLElement).closest(targetSelectors);
    if (!targetElement) {
      return;
    }

    const newIndex = elemsRef.current.indexOf(targetElement as HTMLElement);
    if (newIndex !== -1) {
      // Remove hover class from all elements
      elemsRef.current.forEach((el) => el.classList.remove('hover'));
      // Add hover class to current element
      targetElement.classList.add('hover');
      lastInteraction.current = 'mouse';
      setFocusedIdx(newIndex);
    }
  };

  // Handle mouse leaving the navigation area
  const handleMouseLeave = () => {
    // Remove hover class from all elements
    elemsRef.current.forEach((el) => el.classList.remove('hover'));
    // Reset focused index
    setFocusedIdx(null);
  };

  // Handle keyboard events for navigation and activation
  const handleKeyDown = (evt: React.KeyboardEvent) => {
    // Handle arrow navigation
    lastInteraction.current = 'keyboard';
    handleArrowNavigation(evt);

    // Handle enter/space for activation
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      if (focusedIdx !== null) {
        const focusedElement = elemsRef.current[focusedIdx];
        if (focusedElement) {
          // Create and dispatch a click event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          focusedElement.dispatchEvent(clickEvent);
        }
      }
    }
  };

  // Update hover class and scroll into view when focused index changes
  // The 'hover' class is used for visual feedback and should be styled in CSS
  useEffect(() => {
    if (focusedIdx !== null) {
      elemsRef.current.forEach((el, index) => {
        if (index === focusedIdx) {
          el.classList.add('hover');
          // Only scroll when navigating with keyboard to avoid jarring mouse interactions
          if (lastInteraction.current === 'keyboard') {
            scrollIntoView(el, {block: 'nearest'});
          }
        } else {
          el.classList.remove('hover');
        }
      });
    }
  }, [focusedIdx]);

  // Cleanup effect - runs only on unmount
  useEffect(() => {
    return () => {
      setFocusedIdx(null);
      // Clean up hover classes
      elemsRef.current.forEach((el) => el.classList.remove('hover'));
    };
  }, [setFocusedIdx]);

  return (
    <Container
      ref={containerRef}
      tabIndex={0}
      role="listbox"
      aria-label="Navigation list"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  outline: none;
`;
