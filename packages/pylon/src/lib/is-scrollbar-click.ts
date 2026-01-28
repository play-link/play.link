export function isScrollbarClick(evt: MouseEvent) {
  // Cache scrollbar width calculation
  const scrollbarWidth = (() => {
    if (typeof window === 'undefined') return 17; // SSR fallback

    // Create a temporary div to measure scrollbar width
    const testDiv = document.createElement('div');
    testDiv.style.width = '100px';
    testDiv.style.height = '100px';
    testDiv.style.overflow = 'scroll';
    testDiv.style.position = 'absolute';
    testDiv.style.top = '-9999px';
    document.body.appendChild(testDiv);

    const width = testDiv.offsetWidth - testDiv.clientWidth;
    document.body.removeChild(testDiv);

    return width || 17; // Fallback to 17px if measurement fails
  })();

  const target = evt.target as HTMLElement;
  const container = evt.currentTarget as HTMLElement;

  // Get the container's scrollbar dimensions
  const containerRect = container.getBoundingClientRect();
  const clickX = evt.clientX;
  const clickY = evt.clientY;

  // Check if click is within scrollbar area (typically right edge for vertical, bottom edge for horizontal)
  const isInVerticalScrollbar = clickX > containerRect.right - scrollbarWidth;
  const isInHorizontalScrollbar = clickY > containerRect.bottom - scrollbarWidth;

  // Also check if the target element is part of a scrollable container
  let element = target;
  while (element && element !== container) {
    const computedStyle = window.getComputedStyle(element);
    const hasScrollbar =
      computedStyle.overflow === 'auto' ||
      computedStyle.overflow === 'scroll' ||
      computedStyle.overflowY === 'auto' ||
      computedStyle.overflowY === 'scroll' ||
      computedStyle.overflowX === 'auto' ||
      computedStyle.overflowX === 'scroll';

    if (hasScrollbar) {
      const elementRect = element.getBoundingClientRect();
      const isInElementScrollbar =
        clickX > elementRect.right - scrollbarWidth || clickY > elementRect.bottom - scrollbarWidth;

      if (isInElementScrollbar) {
        return true;
      }
    }

    element = element.parentElement as HTMLElement;
  }

  return isInVerticalScrollbar || isInHorizontalScrollbar;
}
