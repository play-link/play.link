import {Button, DialogOverlay} from '@play/pylon';
import {ConfirmActions, ConfirmContent, ConfirmDescription, ConfirmTitle} from './styles';

interface VisibilityConfirmDialogProps {
  confirmAction: 'publish' | 'unpublish' | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function VisibilityConfirmDialog({
  confirmAction,
  isPending,
  onClose,
  onConfirm,
}: VisibilityConfirmDialogProps) {
  return (
    <DialogOverlay
      opened={confirmAction !== null}
      setOpened={(open) => {
        if (!open) onClose();
      }}
      size="sm"
    >
      <ConfirmContent>
        <ConfirmTitle>
          {confirmAction === 'publish' ? 'Publish page?' : 'Unpublish page?'}
        </ConfirmTitle>
        <ConfirmDescription>
          {confirmAction === 'publish'
            ? 'Your game page will be live and visible to everyone.'
            : 'Your game page will no longer be visible to visitors.'}
        </ConfirmDescription>
        <ConfirmActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={confirmAction === 'unpublish' ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
          >
            {confirmAction === 'publish' ? 'Publish' : 'Unpublish'}
          </Button>
        </ConfirmActions>
      </ConfirmContent>
    </DialogOverlay>
  );
}
