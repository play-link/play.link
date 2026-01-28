import type {RefObject} from 'react';
import type {OverlayPosition} from './Overlay';

/**
 * The minimal space (in px) to leave between the overlay
 * and the viewport edge when fitToScreen or fixed mode is used.
 * If you'd rather parse a CSS var, do something like:
 *  const minGap = parseInt(getComputedStyle(document.body).getPropertyValue('--spacing-2')) || 8;
 */
const DEFAULT_MIN_SCREEN_GAP = 8;

/**
 * Calculate overlay position based on target element and positioning options.
 *
 * Key behaviors:
 * - `noVerticalOverlap`/`noHorizontalOverlap`: Whether overlay should be placed next to (true) or on top of (false) the target
 * - `flip`: When true, will flip to opposite side if there's more space available
 * - `fitToScreen`: When true, ensures overlay stays within viewport bounds
 * - `mode`: 'absolute' includes scroll offsets, 'fixed' uses viewport coordinates
 *
 * @param overlayRef - React ref to the overlay element
 * @param options - Positioning configuration
 * @returns Position object with top, left, and optional maxHeight, or null if invalid
 */
export function getOverlayPosition(
  overlayRef: RefObject<HTMLDivElement | null>,
  {
    horizontalAlign = 'left',
    horizontalOffset = 0,
    verticalAlign = 'top',
    verticalOffset = 0,
    mode = 'absolute',
    fitToScreen = false,
    flip = false,
    noHorizontalOverlap = false,
    noVerticalOverlap = true,
    positionTarget,
    positionEvent,
  }: OverlayPosition,
): {top: number; left: number; maxHeight?: number; maxWidth?: number} | null {
  const overlayElement = overlayRef?.current;
  if (!overlayElement) return null;

  // Acquire targetRect from positionTarget or positionEvent
  const targetRect = positionTarget
    ? positionTarget.getBoundingClientRect()
    : positionEvent
      ? {
          left: positionEvent.clientX,
          top: positionEvent.clientY,
          width: 0,
          height: 0,
          right: positionEvent.clientX,
          bottom: positionEvent.clientY,
        }
      : null;

  if (!targetRect) return null;

  const overlayRect = overlayElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Validate viewport dimensions
  if (viewportWidth <= 0 || viewportHeight <= 0) return null;

  // Validate overlay dimensions
  if (overlayRect.width <= 0 || overlayRect.height <= 0) return null;

  // Get computed style to detect scale transforms
  const computedStyle = window.getComputedStyle(overlayElement);
  const transform = computedStyle.transform;

  // Extract scale value from transform matrix
  let scaleX = 1;
  let scaleY = 1;

  if (transform && transform !== 'none') {
    // Parse transform matrix: matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)
    const matrixMatch = transform.match(
      /matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^)]+)\)/,
    );
    if (matrixMatch) {
      scaleX = Number.parseFloat(matrixMatch[1]);
      scaleY = Number.parseFloat(matrixMatch[4]);
    }
  }

  // Adjust overlay dimensions to account for scale
  const actualOverlayWidth = overlayRect.width / scaleX;
  const actualOverlayHeight = overlayRect.height / scaleY;

  // For 'absolute' mode, we apply scroll offsets
  const scrollX = mode === 'absolute' ? window.scrollX : 0;
  const scrollY = mode === 'absolute' ? window.scrollY : 0;

  let top: number;
  let left: number;
  let maxHeight: number | undefined;
  let maxWidth: number | undefined;

  // ---------------------------
  // Compute Desired Vertical Position
  // ---------------------------
  let desiredTop: number;
  if (verticalAlign === 'top') {
    if (noVerticalOverlap) {
      // place below target rect
      desiredTop = targetRect.bottom + verticalOffset;
    } else {
      // align top edges
      desiredTop = targetRect.top + verticalOffset;
    }
  } else if (verticalAlign === 'middle') {
    desiredTop = targetRect.top + targetRect.height / 2 - actualOverlayHeight / 2 + verticalOffset;
  } else {
    // 'bottom'
    if (noVerticalOverlap) {
      // place overlay above the target
      desiredTop = targetRect.top - actualOverlayHeight - verticalOffset;
    } else {
      // align bottom edges
      desiredTop = targetRect.bottom - actualOverlayHeight + verticalOffset;
    }
  }

  // ---------------------------
  // Compute Desired Horizontal Position
  // ---------------------------
  let desiredLeft: number;
  if (horizontalAlign === 'left') {
    if (noHorizontalOverlap) {
      // place just to the right
      desiredLeft = targetRect.right + horizontalOffset;
    } else {
      // align left edges
      desiredLeft = targetRect.left + horizontalOffset;
    }
  } else if (horizontalAlign === 'center') {
    desiredLeft =
      targetRect.left + targetRect.width / 2 - actualOverlayWidth / 2 + horizontalOffset;
  } else {
    // 'right'
    if (noHorizontalOverlap) {
      // place just to the left
      desiredLeft = targetRect.left - actualOverlayWidth + horizontalOffset;
    } else {
      // align right edges
      desiredLeft = targetRect.right - actualOverlayWidth + horizontalOffset;
    }
  }

  // Apply scroll offsets
  top = desiredTop + scrollY;
  left = desiredLeft + scrollX;

  // ---------------------------
  // Flip Logic (only if mode=fixed or fitToScreen)
  // ---------------------------
  if (flip && (fitToScreen || mode === 'fixed')) {
    // measure vertical space more accurately
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom;

    // Only flip vertical if there's clearly more space on the other side
    if (verticalAlign === 'top' && noVerticalOverlap) {
      // Currently placing below target, check if we should flip to above
      if (
        spaceBelow < actualOverlayHeight + Math.abs(verticalOffset) &&
        spaceAbove > spaceBelow + Math.abs(verticalOffset)
      ) {
        // Flip to above
        desiredTop = targetRect.top - actualOverlayHeight - verticalOffset;
        top = desiredTop + scrollY;
      }
    } else if (verticalAlign === 'bottom' && noVerticalOverlap) {
      // Currently placing above target, check if we should flip to below
      if (
        spaceAbove < actualOverlayHeight + Math.abs(verticalOffset) &&
        spaceBelow > spaceAbove + Math.abs(verticalOffset)
      ) {
        // Flip to below
        desiredTop = targetRect.bottom - verticalOffset;
        top = desiredTop + scrollY;
      }
    } else if (verticalAlign === 'top' && !noVerticalOverlap) {
      // Currently aligning tops, check if we should flip to bottom alignment
      if (spaceBelow < actualOverlayHeight && spaceAbove > spaceBelow) {
        desiredTop = targetRect.bottom - actualOverlayHeight - verticalOffset;
        top = desiredTop + scrollY;
      }
    } else if (verticalAlign === 'bottom' && !noVerticalOverlap) {
      // Currently aligning bottoms, check if we should flip to top alignment
      if (spaceAbove < actualOverlayHeight && spaceBelow > spaceAbove) {
        desiredTop = targetRect.top - verticalOffset;
        top = desiredTop + scrollY;
      }
    }
    // Note: 'middle' alignment typically doesn't flip as it's meant to be centered

    // measure horizontal space more accurately
    const spaceLeft = targetRect.left;
    const spaceRight = viewportWidth - targetRect.right;

    // Only flip horizontal if there's clearly more space on the other side
    if (horizontalAlign === 'left' && noHorizontalOverlap) {
      // Currently placing to the right, check if we should flip to left
      if (
        spaceRight < actualOverlayWidth + Math.abs(horizontalOffset) &&
        spaceLeft > spaceRight + Math.abs(horizontalOffset)
      ) {
        // Flip to left
        desiredLeft = targetRect.left - actualOverlayWidth - horizontalOffset;
        left = desiredLeft + scrollX;
      }
    } else if (horizontalAlign === 'right' && noHorizontalOverlap) {
      // Currently placing to the left, check if we should flip to right
      if (
        spaceLeft < actualOverlayWidth + Math.abs(horizontalOffset) &&
        spaceRight > spaceLeft + Math.abs(horizontalOffset)
      ) {
        // Flip to right
        desiredLeft = targetRect.right - horizontalOffset;
        left = desiredLeft + scrollX;
      }
    } else if (horizontalAlign === 'left' && !noHorizontalOverlap) {
      // Currently aligning lefts, check if we should flip to right alignment
      if (spaceRight < actualOverlayWidth && spaceLeft > spaceRight) {
        desiredLeft = targetRect.right - actualOverlayWidth - horizontalOffset;
        left = desiredLeft + scrollX;
      }
    } else if (horizontalAlign === 'right' && !noHorizontalOverlap) {
      // Currently aligning rights, check if we should flip to left alignment
      if (spaceLeft < actualOverlayWidth && spaceRight > spaceLeft) {
        desiredLeft = targetRect.left - horizontalOffset;
        left = desiredLeft + scrollX;
      }
    }
    // Note: 'center' alignment typically doesn't flip as it's meant to be centered
  }

  // ---------------------------
  // Fit-to-screen logic or mode=fixed
  // Clamp the overlay inside the viewport with a minimal gap.
  // ---------------------------
  if (fitToScreen || mode === 'fixed') {
    const minGap = DEFAULT_MIN_SCREEN_GAP;

    // Handle vertical clamping
    const availableHeight = viewportHeight - 2 * minGap;
    if (actualOverlayHeight > availableHeight) {
      // Overlay is taller than available space - set fixed position and maxHeight
      top = scrollY + minGap;
      maxHeight = availableHeight;
    } else {
      // Clamp top so the overlay fits entirely in the viewport
      const minTop = scrollY + minGap;
      const maxTop = scrollY + viewportHeight - minGap - actualOverlayHeight;
      top = Math.min(Math.max(top, minTop), maxTop);
    }

    // Handle horizontal clamping
    const availableWidth = viewportWidth - 2 * minGap;
    if (actualOverlayWidth > availableWidth) {
      // Overlay is wider than available space - set position and maxWidth
      left = scrollX + minGap;
      maxWidth = availableWidth;
    } else {
      // Clamp left so the overlay fits entirely in the viewport
      const minLeft = scrollX + minGap;
      const maxLeft = scrollX + viewportWidth - minGap - actualOverlayWidth;
      left = Math.min(Math.max(left, minLeft), maxLeft);
    }
  }

  return {top, left, maxHeight, maxWidth};
}
