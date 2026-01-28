import {use} from 'react';
import type {OverlayContextProps} from './OverlayContext';
import {OverlayContext} from './OverlayContext';

export function useOverlay(): OverlayContextProps {
  const context = use<OverlayContextProps | undefined>(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}
