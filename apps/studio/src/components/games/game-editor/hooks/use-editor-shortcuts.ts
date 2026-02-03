import {useEffect} from 'react';

interface UseEditorShortcutsParams {
  onClose: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export function useEditorShortcuts({
  onClose,
  canUndo,
  canRedo,
  undo,
  redo,
}: UseEditorShortcutsParams) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();

      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) undo();
      }

      if (
        ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'z') ||
        (event.ctrlKey && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo) redo();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canRedo, canUndo, onClose, redo, undo]);
}
