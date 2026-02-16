import {Button, DialogOverlay} from '@play/pylon'

interface TableActionConfirmDialogProps {
  opened: boolean
  setOpened: (opened: boolean) => void
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'primary' | 'destructive' | 'outline' | 'ghost'
  isPending?: boolean
  onConfirm: () => void
}

export function TableActionConfirmDialog({
  opened,
  setOpened,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  isPending = false,
  onConfirm,
}: TableActionConfirmDialogProps) {
  return (
    <DialogOverlay opened={opened} setOpened={setOpened} size="sm">
      <DialogOverlay.Header showCloseButton>{title}</DialogOverlay.Header>
      <DialogOverlay.Content>
        <p className="m-0 text-sm text-(--fg-subtle)">{description}</p>
      </DialogOverlay.Content>
      <DialogOverlay.Footer>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpened(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isPending}
        >
          {confirmLabel}
        </Button>
      </DialogOverlay.Footer>
    </DialogOverlay>
  )
}
