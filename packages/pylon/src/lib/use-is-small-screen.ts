import {useMemo} from 'react';
import {breakpoints} from '../style';
import {useWindowSize} from './use-window-size';

interface Props {
  /** When false, skips the resize listener and returns false. Default: true */
  active?: boolean;
}

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Uses the 'md' breakpoint (768px) as the threshold.
 * Also checks for mobile user agent.
 *
 * @param options.active - When false, returns false without listening to resize events
 */
export function useIsSmallScreen({active = true}: Props = {}): boolean {
  const {width} = useWindowSize();

  return useMemo(() => {
    if (!active) return false;

    const isMobileUA =
      typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSmallScreen = width <= breakpoints.md;

    return isMobileUA || isSmallScreen;
  }, [width, active]);
}

export const isSmallScreen =
  typeof window !== 'undefined' &&
  ((typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) ||
    window.innerWidth <= breakpoints.md);
