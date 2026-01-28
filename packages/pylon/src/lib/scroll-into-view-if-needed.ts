/**
 * scrollIntoViewIfNeeded
 *
 * Scrolls the element into view within its parent if it is not fully visible.
 * If `centerIfNeeded` is true (default), the element is centered in the parent's visible area.
 * Otherwise, it uses the browser's native `scrollIntoView` with alignment.
 *
 * @param element - The HTMLElement to scroll into view.
 * @param centerIfNeeded - Optional flag; defaults to true.
 */
export function scrollIntoViewIfNeeded(element: HTMLElement, centerIfNeeded: boolean = true): void {
  const parent = element.parentElement;
  if (!parent) return;

  const parentComputedStyle = window.getComputedStyle(parent);
  const parentBorderTopWidth = Number.parseInt(
    parentComputedStyle.getPropertyValue('border-top-width'),
  );
  const parentBorderLeftWidth = Number.parseInt(
    parentComputedStyle.getPropertyValue('border-left-width'),
  );

  const overTop = element.offsetTop - parent.offsetTop < parent.scrollTop;
  const overBottom =
    element.offsetTop - parent.offsetTop + element.clientHeight - parentBorderTopWidth >
    parent.scrollTop + parent.clientHeight;
  const overLeft = element.offsetLeft - parent.offsetLeft < parent.scrollLeft;
  const overRight =
    element.offsetLeft - parent.offsetLeft + element.clientWidth - parentBorderLeftWidth >
    parent.scrollLeft + parent.clientWidth;
  const alignWithTop = overTop && !overBottom;

  if ((overTop || overBottom) && centerIfNeeded) {
    parent.scrollTop =
      element.offsetTop -
      parent.offsetTop -
      parent.clientHeight / 2 -
      parentBorderTopWidth +
      element.clientHeight / 2;
  }

  if ((overLeft || overRight) && centerIfNeeded) {
    parent.scrollLeft =
      element.offsetLeft -
      parent.offsetLeft -
      parent.clientWidth / 2 -
      parentBorderLeftWidth +
      element.clientWidth / 2;
  }

  if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
    element.scrollIntoView(alignWithTop);
  }
}
