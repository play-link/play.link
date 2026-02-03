import {useCallback, useEffect, useRef, useState} from 'react';

export function useUndoRedo<T>(
  value: T,
  onRestore: (snapshot: T) => void,
  options?: {
    debounceMs?: number;
    maxHistory?: number;
  },
) {
  const debounceMs = options?.debounceMs ?? 1000;
  const maxHistory = options?.maxHistory ?? 100;
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushed = useRef<T>(value);
  const isRestoring = useRef(false);

  const clearPendingTimer = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  const pushHistory = useCallback((snapshot: T) => {
    if (isRestoring.current) return;

    clearPendingTimer();

    debounceTimer.current = setTimeout(() => {
      if (JSON.stringify(lastPushed.current) === JSON.stringify(snapshot)) {
        return;
      }

      setPast((prev) => {
        const nextPast = [...prev, lastPushed.current];
        return nextPast.length > maxHistory
          ? nextPast.slice(nextPast.length - maxHistory)
          : nextPast;
      });
      setFuture([]);
      lastPushed.current = snapshot;
    }, debounceMs);
  }, [clearPendingTimer, debounceMs, maxHistory]);

  useEffect(() => clearPendingTimer, [clearPendingTimer]);

  const flushAndUndo = useCallback(() => {
    // Cancel any pending debounce to prevent stale timer from corrupting history
    clearPendingTimer();

    setPast((prev) => {
      if (prev.length === 0) return prev;

      const previous = prev[prev.length - 1];
      const newPast = prev.slice(0, -1);

      setFuture((f) => [lastPushed.current, ...f]);
      lastPushed.current = previous;
      isRestoring.current = true;
      onRestore(previous);
      requestAnimationFrame(() => {
        isRestoring.current = false;
      });

      return newPast;
    });
  }, [onRestore, clearPendingTimer]);

  const flushAndRedo = useCallback(() => {
    clearPendingTimer();

    setFuture((prev) => {
      if (prev.length === 0) return prev;

      const next = prev[0];
      const newFuture = prev.slice(1);

      setPast((p) => [...p, lastPushed.current]);
      lastPushed.current = next;
      isRestoring.current = true;
      onRestore(next);
      requestAnimationFrame(() => {
        isRestoring.current = false;
      });

      return newFuture;
    });
  }, [onRestore, clearPendingTimer]);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo: flushAndUndo,
    redo: flushAndRedo,
    pushHistory,
  };
}
