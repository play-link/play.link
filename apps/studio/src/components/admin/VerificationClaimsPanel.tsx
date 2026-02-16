import {useState} from 'react'
import {Badge, Button, Loading, Table} from '@play/pylon'
import type {TableColumn} from '@play/pylon'
import {trpc} from '@/lib'
import {TableActionConfirmDialog} from './TableActionConfirmDialog'
import {formatAdminSlug} from './utils/formatAdminSlug'

interface VerificationClaim {
  id: string;
  target_type: string;
  target_id: string;
  slug_snapshot: string | null;
  report_type: string;
  details: string | null;
  reporter_email: string | null;
  status: 'open' | 'reviewing' | 'resolved' | 'rejected';
  resolution_action: string;
  created_at: string;
  game: {
    id: string;
    title: string;
    is_verified: boolean;
  } | null;
  studio: {
    id: string;
    name: string;
    slug: string;
    requested_slug: string | null;
    is_verified: boolean;
  } | null;
  page: {
    id: string;
    slug: string;
    requested_slug: string | null;
  } | null;
}

interface VerificationClaimsPanelProps {
  onUpdate: () => void;
}

function toBadgeIntent(status: VerificationClaim['status']): 'info' | 'warning' | 'success' | 'error' {
  if (status === 'open') return 'warning'
  if (status === 'reviewing') return 'info'
  if (status === 'resolved') return 'success'
  return 'error'
}

function toStatusLabel(status: VerificationClaim['status']): string {
  if (status === 'open') return 'Open'
  if (status === 'reviewing') return 'Reviewing'
  if (status === 'resolved') return 'Resolved'
  return 'Rejected'
}

export function VerificationClaimsPanel({onUpdate}: VerificationClaimsPanelProps) {
  const [pendingAction, setPendingAction] = useState<{
    claim: VerificationClaim
    status: VerificationClaim['status']
    unverifyGame: boolean
    unverifyStudio: boolean
    title: string
    description: string
    confirmLabel: string
    confirmVariant?: 'primary' | 'destructive' | 'outline' | 'ghost'
  } | null>(null)

  const {data: claims = [], isLoading} = trpc.admin.listVerificationClaims.useQuery({})

  const updateClaimMutation = trpc.admin.updateVerificationClaim.useMutation({
    onSuccess: onUpdate,
  })

  const updateClaim = (
    claim: VerificationClaim,
    status: VerificationClaim['status'],
    options?: {unverifyGame?: boolean; unverifyStudio?: boolean},
  ) => {
    updateClaimMutation.mutate({
      claimId: claim.id,
      status,
      unverifyGame: options?.unverifyGame ?? false,
      unverifyStudio: options?.unverifyStudio ?? false,
    })
  }

  const columns: TableColumn<VerificationClaim>[] = [
    {
      title: 'Report',
      accessor: 'report_type',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium capitalize">{d.report_type.replaceAll('_', ' ')}</div>
          <div className="text-sm text-(--fg-subtle)">
            {d.page
              ? `/${formatAdminSlug(d.page.requested_slug, d.page.slug) || d.slug_snapshot || d.target_id}`
              : d.slug_snapshot
                ? `/${d.slug_snapshot}`
                : d.target_id}
          </div>
          {d.details && (
            <div className="text-sm text-(--fg-subtle) line-clamp-2">
              {d.details}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Target',
      accessor: 'target_type',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-1">
          {d.game && <div className="text-sm font-medium">{d.game.title}</div>}
          {d.studio && (
            <div className="text-sm text-(--fg-subtle)">
              @{formatAdminSlug(d.studio.requested_slug, d.studio.slug)}
            </div>
          )}
          {d.reporter_email && (
            <div className="text-xs text-(--fg-subtle)">{d.reporter_email}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      accessor: 'status',
      renderContent: ({d}) => (
        <Badge intent={toBadgeIntent(d.status)}>
          {toStatusLabel(d.status)}
        </Badge>
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
      renderContent: ({d}) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() =>
              setPendingAction({
                claim: d,
                status: 'reviewing',
                unverifyGame: false,
                unverifyStudio: false,
                title: 'Mark as reviewing',
                description: 'Are you sure you want to mark this report as reviewing?',
                confirmLabel: 'Mark as reviewing',
                confirmVariant: 'primary',
              })}
            disabled={updateClaimMutation.isPending || d.status === 'reviewing'}
          >
            Review
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={() =>
              setPendingAction({
                claim: d,
                status: 'resolved',
                unverifyGame: false,
                unverifyStudio: false,
                title: 'Resolve report',
                description: 'Are you sure you want to mark this report as resolved?',
                confirmLabel: 'Resolve',
                confirmVariant: 'primary',
              })}
            disabled={updateClaimMutation.isPending}
          >
            Resolve
          </Button>
          {d.game?.is_verified && (
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setPendingAction({
                  claim: d,
                  status: 'resolved',
                  unverifyGame: true,
                  unverifyStudio: false,
                  title: 'Remove game verification',
                  description: 'Are you sure you want to remove verification from the game linked to this report?',
                  confirmLabel: 'Remove verification',
                  confirmVariant: 'destructive',
                })}
              disabled={updateClaimMutation.isPending}
            >
              Remove game verification
            </Button>
          )}
          {d.studio?.is_verified && (
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setPendingAction({
                  claim: d,
                  status: 'resolved',
                  unverifyGame: false,
                  unverifyStudio: true,
                  title: 'Remove studio verification',
                  description: 'Are you sure you want to remove verification from the studio linked to this report?',
                  confirmLabel: 'Remove verification',
                  confirmVariant: 'destructive',
                })}
              disabled={updateClaimMutation.isPending}
            >
              Remove studio verification
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() =>
              setPendingAction({
                claim: d,
                status: 'rejected',
                unverifyGame: false,
                unverifyStudio: false,
                title: 'Reject report',
                description: 'Are you sure you want to reject this report?',
                confirmLabel: 'Reject',
                confirmVariant: 'destructive',
              })}
            disabled={updateClaimMutation.isPending}
          >
            Reject
          </Button>
        </div>
      ),
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
        data={claims as unknown as VerificationClaim[]}
        propertyForKey="id"
        bleed={8}
        emptyMessage="No reports."
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
          updateClaim(pendingAction.claim, pendingAction.status, {
            unverifyGame: pendingAction.unverifyGame,
            unverifyStudio: pendingAction.unverifyStudio,
          })
          setPendingAction(null)
        }}
      />
    </>
  )
}
