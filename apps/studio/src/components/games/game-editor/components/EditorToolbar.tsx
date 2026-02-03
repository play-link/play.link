import {ArrowLeftIcon, MonitorIcon, Redo2Icon, SmartphoneIcon, Undo2Icon} from 'lucide-react';
import styled from 'styled-components';
import {Button, IconButton} from '@play/pylon';

type PreviewMode = 'desktop' | 'mobile';

interface EditorToolbarProps {
  isDirty: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  previewMode: PreviewMode;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePreviewMode: () => void;
  onSave: () => void;
}

export function EditorToolbar({
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  previewMode,
  onClose,
  onUndo,
  onRedo,
  onTogglePreviewMode,
  onSave,
}: EditorToolbarProps) {
  return (
    <ToolbarRoot>
      <ToolbarLeft>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Back to game"
        >
          <ArrowLeftIcon size={20} />
        </IconButton>
        {isDirty && <UnsavedLabel>Unsaved changes</UnsavedLabel>}
      </ToolbarLeft>

      <ToolbarActions>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          <Undo2Icon size={20} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          <Redo2Icon size={20} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onTogglePreviewMode}
          aria-label="Toggle preview mode"
        >
          {previewMode === 'desktop' ? <SmartphoneIcon size={20} /> : <MonitorIcon size={20} />}
        </IconButton>
        <Button
          variant="primary"
          size="sm"
          fullRounded
          onClick={onSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </ToolbarActions>
    </ToolbarRoot>
  );
}

const ToolbarRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--border-muted);
  flex-shrink: 0;
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const UnsavedLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;
