import type {HTMLAttributes, ReactNode} from 'react';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {createPortal} from 'react-dom';
import type {RuleSet} from 'styled-components';
import styled, {css} from 'styled-components';
import {off, on} from '../../lib/utils';
import {toClassName} from '../../style';
import type {OverlayAnimation} from './animations';
import {getAnimationCss, getShakeCss} from './animations';
import {getOverlayPosition} from './position';

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

/** Predefined overlay sizes for consistent width across the app */
export type OverlaySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Size to max-width mapping */
const overlaySizeMap: Record<OverlaySize, string> = {
  xs: '20rem', // 320px - confirmations, simple alerts
  sm: '24rem', // 384px - small dialogs
  md: '30rem', // 480px - default forms
  lg: '40rem', // 640px - larger forms
  xl: '50rem', // 800px - complex content
  full: '100%', // fullscreen
};

export interface OverlayPosition {
  fitToScreen?: boolean;
  flip?: boolean;
  mode?: 'absolute' | 'fixed' | 'centered';

  // Horizontal
  horizontalAlign?: 'left' | 'center' | 'right';
  horizontalOffset?: number;
  noHorizontalOverlap?: boolean;

  // Vertical
  verticalAlign?: 'top' | 'middle' | 'bottom';
  verticalOffset?: number;
  noVerticalOverlap?: boolean;

  // Positioning references
  positionEvent?: React.MouseEvent | null;
  positionTarget?: HTMLElement | null;
}

export interface OverlayCustomProps {
  animation?: OverlayAnimation;
  cancelOnEscKey?: boolean;
  cancelOnOutsideClick?: boolean;
  children: ReactNode;
  closeOthers?: boolean | string;
  containerCss?: RuleSet<object>;
  disableBodyScroll?: boolean;
  isModal?: boolean;
  modalCss?: RuleSet<object>;
  noAutoFocus?: boolean;
  opened: boolean;
  position?: OverlayPosition;
  pushHistoryState?: boolean;
  setOpened?: (opened: boolean) => void;
  shakeOnBlockedClose?: boolean;
  /** Predefined size preset. If not specified, no max-width is applied. */
  size?: OverlaySize;
  transparentBackdrop?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
  withBackdrop?: boolean;
}

export type OverlayProps = HTMLAttributes<HTMLDivElement> & OverlayCustomProps;

/* ------------------------------------------------------------------
 * Main Component
 * ------------------------------------------------------------------ */

export function Overlay({
  animation,
  cancelOnEscKey = false,
  cancelOnOutsideClick = false,
  children,
  closeOthers = false,
  containerCss,
  disableBodyScroll = false,
  isModal = true,
  modalCss,
  noAutoFocus = false,
  opened = false,
  position,
  pushHistoryState = false,
  ref,
  setOpened,
  shakeOnBlockedClose = false,
  size,
  transparentBackdrop = false,
  triggerRef,
  withBackdrop = false,
  ...restProps
}: OverlayProps & {ref?: React.RefObject<HTMLDivElement | null>}) {
  const [transitioningIn, setTransitioningIn] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  /* --------------------------------------------------------------
   * Refs & State
   * -------------------------------------------------------------- */
  const modalRef = useRef<HTMLDivElement>(null);

  // For backdrop fade in/out
  const [showBackdrop, setShowBackdrop] = useState(false);
  // For controlling existence & visibility in the DOM
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => modalRef.current!);

  /* --------------------------------------------------------------
   * Positioning & Resize
   * -------------------------------------------------------------- */

  const updatePosition = useCallback(() => {
    if (modalRef.current && (position?.positionTarget || position?.positionEvent)) {
      const coords = getOverlayPosition(modalRef, position);
      if (coords) {
        const {top, left, maxHeight, maxWidth} = coords;
        modalRef.current.style.top = `${top}px`;
        modalRef.current.style.left = `${left}px`;

        if (maxHeight !== undefined) {
          modalRef.current.style.maxHeight = `${maxHeight}px`;
          modalRef.current.style.overflowY = 'auto';
        }

        if (maxWidth !== undefined) {
          modalRef.current.style.maxWidth = `${maxWidth}px`;
          modalRef.current.style.overflowX = 'auto';
        }
      }
    }
  }, [position]);

  useEffect(() => {
    if (!modalRef.current) return;
    const resizeObserver = new ResizeObserver(() => updatePosition());
    resizeObserver.observe(modalRef.current);
    return () => resizeObserver.disconnect();
  }, [updatePosition]);

  /* --------------------------------------------------------------
   * Close Handlers
   * -------------------------------------------------------------- */

  const triggerShake = useCallback(() => {
    if (!shakeOnBlockedClose) return;
    setIsShaking(true);
    // Reset shake state after animation completes
    setTimeout(() => setIsShaking(false), 500);
  }, [shakeOnBlockedClose]);

  const handleCancelOnEscKey = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === 'Escape' && isLastOpened(modalRef.current!)) {
        if (cancelOnEscKey) {
          setOpened?.(false);
        } else {
          triggerShake();
        }
      }
    },
    [setOpened, cancelOnEscKey, triggerShake],
  );

  const handleClickOutside = useCallback(
    (evt: MouseEvent) => {
      const currentOverlayElement = modalRef.current;
      if (!currentOverlayElement) return;

      // If the click is inside the current overlay, do nothing.
      if (currentOverlayElement.contains(evt.target as Node)) return;

      // If click is on the trigger, ignore.
      if (triggerRef?.current?.contains(evt.target as Node)) return;

      const overlays = getOpenedOverlays(); // Get all div[data-overlay] elements
      const myIndex = overlays.indexOf(currentOverlayElement);

      if (myIndex === -1) return; // Should not happen

      // Check if the current overlay is NOT the topmost one.
      if (myIndex < overlays.length - 1) {
        // Get all overlays above the current one
        const overlaysAbove = overlays.slice(myIndex + 1);

        // Check if ANY overlay above is modal
        const hasModalAbove = overlaysAbove.some((overlay) => overlay.dataset.isModal === 'true');

        if (hasModalAbove) {
          return; // Protected by a modal overlay above
        }
      }

      // If we reach here, either:
      // 1. The current overlay is the topmost.
      // 2. Or, the overlays on top of it are non-modal (and thus don't shield it).
      if (cancelOnOutsideClick) {
        setOpened?.(false);
      } else {
        triggerShake();
      }
    },
    [setOpened, triggerRef, cancelOnOutsideClick, triggerShake], // isModal prop of current instance isn't directly used in this specific logic structure for now
  );

  const handleCloseOthers = useCallback(
    (evt: CustomEvent<{overlay: HTMLDivElement}>) => {
      if (!closeOthers) return;

      const overlayEl = modalRef.current!;
      // If this overlay isn't last or closeOthers is a string selector
      // that matches the newly opened overlay, close this overlay.
      const shouldClose =
        closeOthers === true ||
        (typeof closeOthers === 'string' && evt.detail.overlay.matches(closeOthers));

      if (!isLastOpened(overlayEl) && shouldClose) {
        setOpened?.(false);
      }
    },
    [closeOthers, setOpened],
  );

  /* --------------------------------------------------------------
   * Effects: Keyboard & Outside Click
   * -------------------------------------------------------------- */

  useEffect(() => {
    if (!visible) return;
    if (!cancelOnEscKey && !shakeOnBlockedClose) return;
    on(document, 'keydown', handleCancelOnEscKey);
    return () => off(document, 'keydown', handleCancelOnEscKey);
  }, [cancelOnEscKey, shakeOnBlockedClose, visible, handleCancelOnEscKey]);

  useEffect(() => {
    if (!visible) return;
    if (!cancelOnOutsideClick && !shakeOnBlockedClose) return;
    on(document, 'mousedown', handleClickOutside, true);
    on(document, 'contextmenu', handleClickOutside, true);
    return () => {
      off(document, 'mousedown', handleClickOutside, true);
      off(document, 'contextmenu', handleClickOutside, true);
    };
  }, [cancelOnOutsideClick, shakeOnBlockedClose, visible, handleClickOutside]);

  /* --------------------------------------------------------------
   * Effects: Close Others
   * -------------------------------------------------------------- */

  useEffect(() => {
    if (!closeOthers) return;
    on(window, 'overlay-opened', handleCloseOthers);
    return () => off(window, 'overlay-opened', handleCloseOthers);
  }, [closeOthers, handleCloseOthers]);

  /* --------------------------------------------------------------
   * Effects: autoFocus
   * -------------------------------------------------------------- */

  useLayoutEffect(() => {
    if (opened && !noAutoFocus && modalRef.current) {
      const x = window.scrollX;
      const y = window.scrollY;
      modalRef.current?.focus({preventScroll: true});
      window.scrollTo(x, y);
    }
  }, [noAutoFocus, opened]);

  /* --------------------------------------------------------------
   * Effects: Body Scroll
   * -------------------------------------------------------------- */

  useEffect(() => {
    if (!opened || !disableBodyScroll) return;

    // Lock scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Unlock scroll only if no other overlays have the same setting
      const overlaysWithScrollDisabled = getOpenedOverlays().filter((el) =>
        el.hasAttribute('data-disabled-body-scroll'),
      );
      if (overlaysWithScrollDisabled.length <= 1) {
        document.body.style.overflow = '';
      }
    };
  }, [disableBodyScroll, opened]);

  /* --------------------------------------------------------------
   * Effects: Push History
   * -------------------------------------------------------------- */

  useEffect(() => {
    const handlePopState = () => {
      if (opened) setOpened?.(false);
    };

    if (pushHistoryState) {
      on(window, 'popstate', handlePopState);
      if (opened) {
        window.history.pushState({}, '');
      }
    }
    return () => off(window, 'popstate', handlePopState);
  }, [pushHistoryState, opened, setOpened]);

  /* --------------------------------------------------------------
   * Effects: Show / Hide
   * -------------------------------------------------------------- */

  useEffect(() => {
    let timeoutId: number;

    if (opened && !visible) {
      // Open overlay - defer state updates to avoid cascading renders
      timeoutId = window.setTimeout(() => {
        if (animation) {
          setTransitioningIn(true);
        } else {
          setVisible(true);
        }
      }, 0);
    } else if (!opened && visible) {
      // Defer closing state update as well
      timeoutId = window.setTimeout(() => {
        setVisible(false);
      }, 0);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [animation, opened, visible]);

  useLayoutEffect(() => {
    if (visible && modalRef.current) {
      updatePosition();
    }
  }, [visible, updatePosition]);

  // Dispatch 'overlay-opened' event immediately when `opened` is true
  useLayoutEffect(() => {
    if (opened) {
      window.dispatchEvent(
        new CustomEvent('overlay-opened', {
          detail: {overlay: modalRef.current},
        }),
      );
    }
  }, [opened]);

  /* --------------------------------------------------------------
   * Effects: Backdrop
   * -------------------------------------------------------------- */

  useEffect(() => {
    if (!withBackdrop) return;

    let timeoutId: number;

    if (opened && !visible) {
      // about to show - defer state update to avoid cascading renders
      timeoutId = window.setTimeout(() => {
        setShowBackdrop(true);
      }, 0);
    } else if (!opened && visible) {
      // about to hide - defer state update as well
      timeoutId = window.setTimeout(() => {
        setShowBackdrop(false);
      }, 0);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [opened, visible, withBackdrop]);

  /* --------------------------------------------------------------
   * Early Return if not open nor visible
   * -------------------------------------------------------------- */

  if (!opened && !visible) {
    return null;
  }

  /* --------------------------------------------------------------
   * Render
   * -------------------------------------------------------------- */
  return createPortal(
    <Root $mode={position?.mode} $extraCss={containerCss}>
      <Modal
        ref={modalRef}
        data-overlay
        data-is-modal={isModal}
        tabIndex={0}
        $animation={animation}
        $mode={position?.mode}
        $modalCss={modalCss}
        $shakeCss={isShaking ? getShakeCss() : null}
        $size={size}
        onTransitionEnd={() => {
          setTransitioningIn(false);
          setVisible(opened);
        }}
        {...(disableBodyScroll && {'data-disabled-body-scroll': true})}
        {...restProps}
        className={`${toClassName({
          'animate-in': opened && !visible && transitioningIn,
          opened: opened && visible && !transitioningIn,
        })} ${restProps.className}`}
      >
        {children}
      </Modal>
      {withBackdrop && (
        <Backdrop
          className={toClassName({
            'show-backdrop': showBackdrop,
            'transparent-backdrop': transparentBackdrop,
          })}
          onMouseDown={(e) => {
            if (cancelOnOutsideClick) {
              e.stopPropagation();
            }
          }}
          onClick={(e) => {
            if (cancelOnOutsideClick) {
              e.stopPropagation();
            }
          }}
        />
      )}
    </Root>,
    document.body,
  );
}

/* ------------------------------------------------------------------
 * Helper Functions
 * ------------------------------------------------------------------ */

/** Return an array of all "data-overlay" elements in the DOM. */
function getOpenedOverlays(): HTMLDivElement[] {
  return Array.from(document.body.querySelectorAll<HTMLDivElement>('div[data-overlay]'));
}

/** True if the given overlayEl is the last in getOpenedOverlays(). */
function isLastOpened(overlayEl: HTMLDivElement | null): boolean {
  if (!overlayEl) return false;
  const overlays = getOpenedOverlays();
  return overlays.length - 1 === overlays.indexOf(overlayEl);
}

/* ------------------------------------------------------------------
 * Styled Components
 * ------------------------------------------------------------------ */

const Root = styled.div<{
  $mode?: OverlayPosition['mode'];
  $extraCss?: RuleSet<object>;
}>`
  inset: 0;
  pointer-events: none;
  z-index: 999990;

  ${(p) => p.$extraCss}

  ${(p) =>
    p.$mode === 'centered'
      ? css`
          align-items: center;
          display: flex;
          justify-content: center;
          position: fixed;
        `
      : css`
          position: ${p.$mode === 'fixed' ? 'fixed' : 'absolute'};
        `}
`;

const Modal = styled.div<{
  $mode?: OverlayPosition['mode'];
  $modalCss?: RuleSet<object>;
  $animation?: OverlayAnimation;
  $shakeCss?: ReturnType<typeof css> | null;
  $size?: OverlaySize;
}>`
  max-height: 100%;
  opacity: 0;
  outline: 0;
  pointer-events: all;
  position: ${(p) => (p.$mode === 'centered' ? 'relative' : 'absolute')};
  z-index: 999992;

  &.opened {
    opacity: 1;
  }

  ${(p) => p.$size && `max-width: ${overlaySizeMap[p.$size]}; width: 100%;`}

  ${(p) => getAnimationCss(p.$animation)}

  ${(p) => p.$modalCss}

  ${(p) => p.$shakeCss}
`;

const Backdrop = styled.div`
  background: rgba(0, 0, 0, 0.25);
  inset: 0;
  opacity: 0;
  pointer-events: none;
  position: fixed;
  transition: opacity 0.25s;
  z-index: 999991;

  &.show-backdrop {
    opacity: 1;
    pointer-events: all;
  }

  &.transparent-backdrop {
    background: transparent;
  }

  &:not(.transparent-backdrop) {
    backdrop-filter: blur(2px);
  }
`;
