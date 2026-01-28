import type {HTMLAttributes, ReactNode} from 'react';
import {cloneElement, isValidElement, useCallback, useEffect, useRef, useState} from 'react';
import styled, {css} from 'styled-components';
import type {OverlayPosition} from '../overlay';
import {Overlay} from '../overlay';

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  delay?: number;
  active?: boolean;
  keepOpenedOnChildFocus?: boolean;
  overlayPosition?: Omit<OverlayPosition, 'positionTarget'>;
  severity?: TooltipSeverity;
  text?: string | ReactNode;
  title?: string;
  followMouse?: boolean;
}

export function Tooltip({
  children,
  delay = 0,
  active = true,
  keepOpenedOnChildFocus = false,
  overlayPosition,
  severity = 'default',
  text,
  title,
  followMouse = false,
  ...props
}: TooltipProps) {
  const childrenRef = useRef<HTMLElement>(null);
  const [opened, setOpened] = useState<boolean>(false);
  const [isChildFocused, setIsChildFocused] = useState(false);
  const mouseEventRef = useRef<React.MouseEvent | null>(null);
  const [mouseEvent, setMouseEvent] = useState<React.MouseEvent | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const openJob = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeJob = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts and RAF on unmount
  useEffect(() => {
    return () => {
      if (openJob.current) clearTimeout(openJob.current);
      if (closeJob.current) clearTimeout(closeJob.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (followMouse) {
        // Store in ref immediately for low latency
        mouseEventRef.current = e;
        // Use requestAnimationFrame to batch state updates
        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            setMouseEvent(mouseEventRef.current);
            rafIdRef.current = null;
          });
        }
      }
    },
    [followMouse],
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (followMouse) {
        mouseEventRef.current = e;
        setMouseEvent(e);
      }
      clearTimeout(openJob.current ?? -1);
      clearTimeout(closeJob.current ?? -1);
      if (delay > 0) {
        openJob.current = setTimeout(() => {
          setOpened(true);
        }, delay);
      } else {
        setOpened(true);
      }
    },
    [delay, followMouse],
  );

  const handleMouseLeave = useCallback(() => {
    clearTimeout(openJob.current ?? -1);
    clearTimeout(closeJob.current ?? -1);
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    closeJob.current = setTimeout(() => {
      setOpened(false);
      if (followMouse) {
        mouseEventRef.current = null;
        setMouseEvent(null);
      }
    });
  }, [followMouse]);

  // Document-level mouse tracking for followMouse mode
  useEffect(() => {
    const isVisible = (keepOpenedOnChildFocus && isChildFocused) || opened;
    if (!followMouse || !isVisible) return;

    const handleDocumentMouseMove = (e: MouseEvent) => {
      // Convert native MouseEvent to React.MouseEvent-like object
      const syntheticEvent = {
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
        nativeEvent: e,
      } as React.MouseEvent;

      mouseEventRef.current = syntheticEvent;
      // Use requestAnimationFrame to batch state updates
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          setMouseEvent(mouseEventRef.current);
          rafIdRef.current = null;
        });
      }
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
    };
  }, [followMouse, keepOpenedOnChildFocus, isChildFocused, opened]);

  // Only add focus tracking when keepOpenedOnChildFocus is true
  useEffect(() => {
    if (!keepOpenedOnChildFocus) return;

    const handleGlobalClick = (e: MouseEvent) => {
      if (!childrenRef.current?.contains(e.target as Node)) {
        setIsChildFocused(false);
        setOpened(false);
      }
    };

    const handleGlobalFocus = (e: FocusEvent) => {
      if (!childrenRef.current?.contains(e.target as Node)) {
        setIsChildFocused(false);
        setOpened(false);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('focusin', handleGlobalFocus);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('focusin', handleGlobalFocus);
    };
  }, [keepOpenedOnChildFocus]);

  let childWithRef;

  const handleFocus = useCallback(() => {
    if (keepOpenedOnChildFocus) {
      setIsChildFocused(true);
    }
  }, [keepOpenedOnChildFocus]);

  if (isValidElement(children) && typeof children.type === 'function') {
    childWithRef = (
      <div
        ref={childrenRef as any}
        onMouseEnter={handleMouseEnter}
        onMouseMove={followMouse ? handleMouseMove : undefined}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={handleFocus}
        className="inline-flex"
        {...props}
      >
        {children}
      </div>
    );
  } else {
    childWithRef = cloneElement(children as any, {
      ref: childrenRef,
      onMouseEnter: handleMouseEnter,
      onMouseMove: followMouse ? handleMouseMove : undefined,
      onMouseLeave: handleMouseLeave,
      onFocusCapture: handleFocus,
    });
  }

  const visible = (keepOpenedOnChildFocus && isChildFocused) || opened;

  return (
    <Root>
      {childWithRef}
      {visible && !!childrenRef.current && active && (
        <Overlay
          opened={visible}
          role="tooltip"
          noAutoFocus
          isModal={false}
          animation="scale-in"
          position={{
            fitToScreen: true,
            ...(followMouse && mouseEvent
              ? {positionEvent: mouseEvent}
              : {positionTarget: childrenRef.current}),
            horizontalAlign: 'center',
            verticalOffset: 2,
            ...overlayPosition,
          }}
          onMouseEnter={() => clearTimeout(closeJob.current!)}
          onMouseLeave={handleMouseLeave}
          modalCss={css`
            background: ${styleMap[severity].bgColor};
            border-radius: var(--tooltip-radius, var(--radius-md));
            box-shadow: var(--shadow-sm);
            color: ${styleMap[severity].color};
            cursor: default;
            line-height: var(--leading-tight);
            max-width: 18.5rem;
            padding: var(--spacing-1) var(--spacing-2);
            ${followMouse ? 'pointer-events: none;' : ''}
          `}
        >
          {!!title && <div className="font-medium text-sm">{title}</div>}
          {!!text && <span className="text-sm">{text}</span>}
        </Overlay>
      )}
    </Root>
  );
}

const Root = styled.div`
  display: contents;
`;

type TooltipSeverity = 'default' | 'success' | 'info' | 'warning' | 'error';

const styleMap: {
  [_key in TooltipSeverity]: {
    bgColor: string;
    color: string;
  };
} = {
  default: {
    bgColor: 'var(--color-gray-900)',
    color: 'var(--white)',
  },
  success: {
    bgColor: 'var(--success-dark)',
    color: 'var(--success-dark-contrast-text)',
  },
  info: {
    bgColor: 'var(--info-dark)',
    color: 'var(--info-dark-contrast-text)',
  },
  warning: {
    bgColor: 'var(--warning-dark)',
    color: 'var(--warning-dark-contrast-text)',
  },
  error: {
    bgColor: 'var(--error-dark)',
    color: 'var(--error-dark-contrast-text)',
  },
};
