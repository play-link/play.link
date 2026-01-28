import {useCallback, useEffect, useRef} from 'react';
import type {RefObject} from 'react';

export interface UseInfiniteScrollOptions {
  /** Whether infinite scroll is enabled */
  enabled: boolean;
  /** Current number of visible items */
  visibleCount: number;
  /** Total number of items available */
  totalCount: number;
  /** Number of items to add when loading more */
  incrementBy?: number;
  /** Callback when more items should be loaded */
  onLoadMore: () => void;
  /** Root margin for intersection observer (trigger before reaching end) */
  rootMargin?: string;
  /** Optional scroll container ref to use as IntersectionObserver root */
  scrollContainerRef?: RefObject<Element | null>;
}

export function useInfiniteScroll({
  enabled,
  visibleCount,
  totalCount,
  onLoadMore,
  rootMargin = '200px',
  scrollContainerRef,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < totalCount;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore) {
        onLoadMore();
      }
    },
    [hasMore, onLoadMore],
  );

  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root: scrollContainerRef?.current ?? null,
      rootMargin,
    });

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [enabled, handleIntersect, rootMargin, scrollContainerRef]);

  return {
    sentinelRef,
    hasMore,
  };
}
