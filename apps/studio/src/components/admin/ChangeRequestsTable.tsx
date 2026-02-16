import {useState} from 'react';
import {Badge, Button, Table} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib';
import {TableActionConfirmDialog} from './TableActionConfirmDialog';

interface ChangeRequest {
  id: number;
  entity_type: string;
  field_name: string;
  current_value: string;
  requested_value: string;
  requested_by_email: string | null;
  status: string;
  reviewed_at: string | null;
}

interface ChangeRequestsTableProps {
  changeRequests: ChangeRequest[];
  onUpdate: () => void;
}

function toStatusLabel(status: string): string {
  if (status === 'pending') return 'Pending';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return status;
}

export function ChangeRequestsTable({
  changeRequests,
  onUpdate,
}: ChangeRequestsTableProps) {
  const [pendingAction, setPendingAction] = useState<{
    id: number;
    entity_type: string;
    field_name: string;
    requested_value: string;
    type: 'approve' | 'reject';
  } | null>(null);

  const approveMutation = trpc.changeRequest.approve.useMutation({
    onSuccess: onUpdate,
  });

  const rejectMutation = trpc.changeRequest.reject.useMutation({
    onSuccess: onUpdate,
  });
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  const columns: TableColumn<ChangeRequest>[] = [
    {
      title: 'Entity',
      accessor: 'entity_type',
    },
    {
      title: 'Field',
      accessor: 'field_name',
    },
    {
      title: 'Current value',
      accessor: 'current_value',
    },
    {
      title: 'Requested value',
      accessor: 'requested_value',
    },
    {
      title: 'Status',
      accessor: 'status',
      renderContent: ({d}) => <Badge>{toStatusLabel(d.status)}</Badge>,
    },
    {
      title: 'Requester',
      accessor: 'requested_by_email',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {d.requested_by_email || '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      accessor: 'actions',
      renderContent: ({d}) => {
        if (d.status !== 'pending') {
          return (
            <span className="text-sm text-gray-400">
              {d.reviewed_at
                ? new Date(d.reviewed_at).toLocaleDateString()
                : '-'}
            </span>
          );
        }
        return (
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="xs"
              onClick={() => setPendingAction({
                id: d.id,
                entity_type: d.entity_type,
                field_name: d.field_name,
                requested_value: d.requested_value,
                type: 'approve',
              })}
              disabled={isMutating}
            >
              Approve
            </Button>
            <Button
              size="xs"
              onClick={() => setPendingAction({
                id: d.id,
                entity_type: d.entity_type,
                field_name: d.field_name,
                requested_value: d.requested_value,
                type: 'reject',
              })}
              disabled={isMutating}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        data={changeRequests}
        propertyForKey="id"
        bleed={8}
        emptyMessage="No change requests."
      />
      <TableActionConfirmDialog
        opened={Boolean(pendingAction)}
        setOpened={(opened) => {
          if (!opened) setPendingAction(null);
        }}
        title={pendingAction?.type === 'reject' ? 'Reject request' : 'Approve request'}
        description={pendingAction
          ? pendingAction.type === 'reject'
            ? `Are you sure you want to reject changing ${pendingAction.field_name} to "${pendingAction.requested_value}"?`
            : `Are you sure you want to approve changing ${pendingAction.field_name} to "${pendingAction.requested_value}"?`
          : ''}
        confirmLabel={pendingAction?.type === 'reject' ? 'Reject' : 'Approve'}
        confirmVariant={pendingAction?.type === 'reject' ? 'destructive' : 'primary'}
        isPending={isMutating}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === 'reject') {
            rejectMutation.mutate({
              id: pendingAction.id,
              notes: 'Rejected from admin',
            });
          } else {
            approveMutation.mutate({id: pendingAction.id});
          }
          setPendingAction(null);
        }}
      />
    </>
  );
}
