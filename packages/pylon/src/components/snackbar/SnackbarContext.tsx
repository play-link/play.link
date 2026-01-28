import type {ReactNode} from 'react';
import {createContext, use, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import styled, {css} from 'styled-components';
import {SnackbarItem as SnackbarItemComponent} from './SnackbarItem';

export type SnackbarSeverity = 'success' | 'info' | 'warning' | 'error';

export interface SnackbarItem {
  id: string;
  message: ReactNode;
  severity: SnackbarSeverity;
  duration: number;
}

export interface ShowSnackbarOptions {
  message: ReactNode;
  severity?: SnackbarSeverity;
  /** Duration in ms. Set to 0 for no auto-dismiss. @default 3500 */
  duration?: number;
}

interface SnackbarContextValue {
  showSnackbar: (options: ShowSnackbarOptions) => string;
  dismissSnackbar: (id: string) => void;
  dismissAll: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

let snackbarIdCounter = 0;
const MAX_VISIBLE = 5;

export type SnackbarPosition = 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';

interface SnackbarProviderProps {
  children: ReactNode;
  /** Position of the snackbar stack @default 'top-center' */
  position?: SnackbarPosition;
}

export function SnackbarProvider({children, position = 'top-center'}: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<SnackbarItem[]>([]);

  const showSnackbar = useCallback((options: ShowSnackbarOptions): string => {
    const id = `snackbar-${++snackbarIdCounter}`;
    const item: SnackbarItem = {
      id,
      message: options.message,
      severity: options.severity ?? 'success',
      duration: options.duration ?? 3500,
    };

    setSnackbars((prev) => [...prev, item]);
    return id;
  }, []);

  const dismissSnackbar = useCallback((id: string) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setSnackbars([]);
  }, []);

  const value = useMemo(
    () => ({showSnackbar, dismissSnackbar, dismissAll}),
    [showSnackbar, dismissSnackbar, dismissAll],
  );

  const visibleSnackbars = snackbars.slice(-MAX_VISIBLE);

  return (
    <SnackbarContext value={value}>
      {children}
      {createPortal(
        <Container $position={position}>
          {visibleSnackbars.map((snackbar) => (
            <SnackbarItemWrapper
              key={snackbar.id}
              snackbar={snackbar}
              onDismiss={dismissSnackbar}
            />
          ))}
        </Container>,
        document.body,
      )}
    </SnackbarContext>
  );
}

interface SnackbarItemWrapperProps {
  snackbar: SnackbarItem;
  onDismiss: (id: string) => void;
}

function SnackbarItemWrapper({snackbar, onDismiss}: SnackbarItemWrapperProps) {
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (snackbar.duration > 0) {
      timerRef.current = window.setTimeout(() => {
        onDismiss(snackbar.id);
      }, snackbar.duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [snackbar.id, snackbar.duration, onDismiss]);

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onDismiss(snackbar.id);
  };

  return (
    <SnackbarItemComponent severity={snackbar.severity} onDismiss={handleDismiss}>
      {snackbar.message}
    </SnackbarItemComponent>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSnackbar() {
  const context = use(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

const Container = styled.div<{$position: SnackbarPosition}>`
  position: fixed;
  z-index: 999999;
  pointer-events: none;
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);

  ${(p) => {
    switch (p.$position) {
      case 'top-center':
        return css`
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        `;
      case 'top-right':
        return css`
          top: 0;
          right: 0;
        `;
      case 'bottom-center':
        return css`
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          flex-direction: column-reverse;
        `;
      case 'bottom-right':
        return css`
          bottom: 0;
          right: 0;
          flex-direction: column-reverse;
        `;
      default:
        return css`
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        `;
    }
  }}
`;
