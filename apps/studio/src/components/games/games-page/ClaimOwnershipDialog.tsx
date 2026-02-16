import {useMemo, useState} from 'react'
import {Button, DialogOverlay, Fieldset, Input, Textarea, useSnackbar} from '@play/pylon'
import {trpc} from '@/lib/trpc'

interface ClaimOwnershipDialogProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  targetStudioId: string;
  initialSlug?: string;
}

function normalizeSlugInput(value: string): string {
  let normalized = value.trim().toLowerCase()

  normalized = normalized
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/^play\.link\//, '')
    .replace(/^g\//, '')
    .replace(/^@/, '')

  normalized = normalized
    .split('?')[0]!
    .split('#')[0]!
    .replace(/^\/+|\/+$/g, '')

  if (normalized.includes('/')) {
    normalized = normalized.split('/')[0]!
  }

  return normalized
}

function isValidSlug(value: string): boolean {
  return value.length >= 3 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function ClaimOwnershipDialog({
  opened,
  setOpened,
  targetStudioId,
  initialSlug,
}: ClaimOwnershipDialogProps) {
  const {showSnackbar} = useSnackbar()
  const [slugInput, setSlugInput] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const slugInputValue = slugInput ?? (opened ? initialSlug || '' : '')
  const normalizedSlug = useMemo(() => normalizeSlugInput(slugInputValue), [slugInputValue])
  const slugValid = isValidSlug(normalizedSlug)

  const claimOwnership = trpc.ownershipClaim.claimOwnership.useMutation({
    onSuccess: () => {
      showSnackbar({
        message: `Ownership claim submitted for /${normalizedSlug}`,
        severity: 'success',
      })
      handleClose()
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'})
    },
  })

  const handleClose = () => {
    setOpened(false)
    setSlugInput(null)
    setDetails('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!slugValid || claimOwnership.isPending) return

    claimOwnership.mutate({
      pageSlug: normalizedSlug,
      targetStudioId,
      details: details.trim() || null,
    })
  }

  return (
    <DialogOverlay
      opened={opened}
      setOpened={setOpened}
      size="sm"
      as="form"
      onSubmit={handleSubmit}
    >
      <DialogOverlay.Header showCloseButton>Claim game ownership</DialogOverlay.Header>
      <DialogOverlay.Content className="flex flex-col gap-4">
        <p className="text-sm text-(--fg-muted) m-0">
          If a game page belongs to your studio, submit a claim and Admin will review it.
        </p>

        <Fieldset
          label="Game slug or URL"
          helpText={
            slugInputValue.trim().length === 0
              ? 'Paste a slug like my-game or a full play.link URL.'
              : slugValid
                ? `Claim will be submitted for /${normalizedSlug}.`
                : 'Invalid slug format. Use lowercase letters, numbers and hyphens.'
          }
        >
          <Input
            value={slugInputValue}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder="play.link/my-game"
            invalid={slugInputValue.trim().length > 0 && !slugValid}
          />
        </Fieldset>

        <Fieldset
          label="Details (optional)"
          helpText="Add evidence or context to help admin validate ownership."
        >
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Official website, studio socials, release links, etc."
          />
        </Fieldset>
      </DialogOverlay.Content>

      <DialogOverlay.Footer>
        <Button
          type="button"
          variant="ghost"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!slugValid || claimOwnership.isPending}
        >
          {claimOwnership.isPending ? 'Submitting...' : 'Submit claim'}
        </Button>
      </DialogOverlay.Footer>
    </DialogOverlay>
  )
}
