export function afterNextRender(cb: () => void) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      cb();
    }, 0);
  });
}

export function on<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  // eslint-disable-next-line ts/no-unsafe-function-type
  ...args: Parameters<T['addEventListener']> | [string, Function | null, ...any]
): void {
  if (obj && obj.addEventListener) {
    obj.addEventListener(...(args as Parameters<HTMLElement['addEventListener']>));
  }
}

export function off<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args:
    | Parameters<T['removeEventListener']>
    // eslint-disable-next-line ts/no-unsafe-function-type
    | [string, Function | null, ...any]
): void {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(...(args as Parameters<HTMLElement['removeEventListener']>));
  }
}

export function toFloatOrNull(value: any) {
  if (value === null || typeof value === 'undefined') return null;
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

export function scrollIntoView(element: HTMLElement, options: ScrollIntoViewOptions) {
  if ('scrollIntoViewIfNeeded' in element && typeof element.scrollIntoViewIfNeeded === 'function') {
    // The parameter for `scrollIntoViewIfNeeded` is a boolean, where true = center.
    // We'll map the 'block' option to this. 'center' becomes true, others become false.
    const centerIfNeeded = options.block === 'center';
    element.scrollIntoViewIfNeeded(centerIfNeeded);
  } else {
    element.scrollIntoView(options);
  }
}

export function truncate(str: string | number, maxLength: number) {
  const _str = typeof str === 'number' ? str.toString() : str;
  if (!_str) return '';
  if (_str.length <= maxLength) return _str;
  return `${_str.slice(0, maxLength)}...`;
}
