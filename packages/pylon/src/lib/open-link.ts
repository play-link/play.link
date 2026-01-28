/**
 * Opens a URL in a new tab, respecting PWA tabbed application mode.
 * This function creates an anchor element and programmatically clicks it,
 * which ensures the link opens in a new tab within the PWA context
 * rather than in the browser window.
 *
 * @param url - The URL to open
 * @param options - Optional configuration
 * @param options.target - The target window (default: '_blank')
 * @param options.rel - The rel attribute for security (default: 'noopener noreferrer')
 */
export function openLinkInNewTab(
  url: string,
  options?: {
    target?: string;
    rel?: string;
  },
): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = options?.target ?? '_blank';
  link.rel = options?.rel ?? 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
