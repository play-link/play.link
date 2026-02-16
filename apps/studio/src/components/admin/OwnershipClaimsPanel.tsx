import {useState} from 'react'
import {Badge, Button, Loading, Table} from '@play/pylon'
import type {TableColumn} from '@play/pylon'
import {trpc} from '@/lib'
import {TableActionConfirmDialog} from './TableActionConfirmDialog'
import {formatAdminSlug} from './utils/formatAdminSlug'

type OwnershipClaimStatus = 'open' | 'approved' | 'rejected'

interface OwnershipClaim {
  id: string;
  status: OwnershipClaimStatus;
  claimed_slug: string;
  details: string | null;
  claimant_email: string | null;
  created_at: string;
  current_studio: {
    id: string;
    name: string;
    slug: string;
    requested_slug: string | null;
  } | null;
  requested_studio: {
    id: string;
    name: string;
    slug: string;
    requested_slug: string | null;
  } | null;
  game: {
    id: string;
    title: string;
  } | null;
  page: {
    id: string;
    slug: string;
    requested_slug: string | null;
  } | null;
}

interface OwnershipClaimsPanelProps {
  onUpdate: () => void;
}

function toBadgeIntent(status: OwnershipClaimStatus): 'warning' | 'success' | 'error' {
  if (status === 'open') return 'warning'
  if (status === 'approved') return 'success'
  return 'error'
}

function toStatusLabel(status: OwnershipClaimStatus): string {
  if (status === 'open') return 'Open'
  if (status === 'approved') return 'Approved'
  return 'Rejected'
}

export function OwnershipClaimsPanel({onUpdate}: OwnershipClaimsPanelProps) {
  const [pendingAction, setPendingAction] = useState<{
    claim: OwnershipClaim
    status: OwnershipClaimStatus
    transferOwnership: boolean
    title: string
    description: string
    confirmLabel: string
    confirmVariant?: 'primary' | 'destructive' | 'outline' | 'ghost'
  } | null>(null)

  const {data: claims = [], isLoading} = trpc.admin.listOwnershipClaims.useQuery({})

  const updateClaimMutation = trpc.admin.updateOwnershipClaim.useMutation({
    onSuccess: onUpdate,
  })

  const updateClaim = (
    claim: OwnershipClaim,
    status: OwnershipClaimStatus,
    options?: {transferOwnership?: boolean},
  ) => {
    updateClaimMutation.mutate({
      claimId: claim.id,
      status,
      transferOwnership: options?.transferOwnership ?? true,
    })
  }

  const columns: TableColumn<OwnershipClaim>[] = [
    {
      title: 'Slug',
      accessor: 'claimed_slug',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">
            /{formatAdminSlug(d.page?.requested_slug, d.page?.slug) || d.claimed_slug}
          </div>
          {d.game && (
            <div className="text-sm text-(--fg-subtle)">{d.game.title}</div>
          )}
          {d.details && (
            <div className="text-sm text-(--fg-subtle) line-clamp-2">{d.details}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Claim',
      accessor: 'current_studio',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            <span className="text-(--fg-subtle)">From:</span>{' '}
            @{formatAdminSlug(d.current_studio?.requested_slug, d.current_studio?.slug) || 'unknown'}
          </div>
          <div className="text-sm">
            <span className="text-(--fg-subtle)">To:</span>{' '}
            @{formatAdminSlug(d.requested_studio?.requested_slug, d.requested_studio?.slug) || 'unknown'}
          </div>
          {d.claimant_email && (
            <div className="text-xs text-(--fg-subtle)">{d.claimant_email}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      accessor: 'status',
      renderContent: ({d}) => (
        <Badge intent={toBadgeIntent(d.status)}>{toStatusLabel(d.status)}</Badge>
      ),
    },
    {
      title: 'Created',
      accessor: 'created_at',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {new Date(d.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      accessor: 'actions',
      renderContent: ({d}) => {
        if (d.status !== 'open') {
          return <span className="text-sm text-(--fg-subtle)">—</span>
        }

        return (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="xs"
              onClick={() =>
                setPendingAction({
                  claim: d,
                  status: 'approved',
                  transferOwnership: true,
                  title: 'Approve transfer',
                  description: `Are you sure you want to transfer ownership of /${formatAdminSlug(d.page?.requested_slug, d.page?.slug) || d.claimed_slug} to the requesting studio?`,
                  confirmLabel: 'Approve transfer',
                  confirmVariant: 'primary',
                })}
              disabled={updateClaimMutation.isPending}
            >
              Approve transfer
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                setPendingAction({
                  claim: d,
                  status: 'rejected',
                  transferOwnership: false,
                  title: 'Reject claim',
                  description: `Are you sure you want to reject the claim for /${formatAdminSlug(d.page?.requested_slug, d.page?.slug) || d.claimed_slug}?`,
                  confirmLabel: 'Reject',
                  confirmVariant: 'destructive',
                })}
              disabled={updateClaimMutation.isPending}
            >
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading />
      </div>
    )
  }

  return (
    <>
      <Table
        columns={columns}
        data={claims as unknown as OwnershipClaim[]}
        propertyForKey="id"
        bleed={8}
        emptyMessage="No ownership claims."
      />
      <TableActionConfirmDialog
        opened={Boolean(pendingAction)}
        setOpened={(opened) => {
          if (!opened) setPendingAction(null)
        }}
        title={pendingAction?.title || 'Confirm action'}
        description={pendingAction?.description || ''}
        confirmLabel={pendingAction?.confirmLabel || 'Confirm'}
        confirmVariant={pendingAction?.confirmVariant}
        isPending={updateClaimMutation.isPending}
        onConfirm={() => {
          if (!pendingAction) return
          updateClaim(
            pendingAction.claim,
            pendingAction.status,
            {transferOwnership: pendingAction.transferOwnership},
          )
          setPendingAction(null)
        }}
      />
    </>
  )
}
