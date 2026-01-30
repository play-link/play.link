import {Badge, Button, Card, Table} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib';

interface ChangeRequest {
  id: string;
  entity_type: string;
  field_name: string;
  current_value: string;
  requested_value: string;
  status: string;
}

interface ChangeRequestsTableProps {
  changeRequests: ChangeRequest[];
  onUpdate: () => void;
}

export function ChangeRequestsTable({
  changeRequests,
  onUpdate,
}: ChangeRequestsTableProps) {
  const approveMutation = trpc.changeRequest.approve.useMutation({
    onSuccess: onUpdate,
  });

  const rejectMutation = trpc.changeRequest.reject.useMutation({
    onSuccess: onUpdate,
  });

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
      title: 'Current Value',
      accessor: 'current_value',
    },
    {
      title: 'Requested Value',
      accessor: 'requested_value',
    },
    {
      title: 'Status',
      accessor: 'status',
      renderContent: ({d}) => <Badge>{d.status}</Badge>,
    },
    {
      title: 'Actions',
      accessor: 'actions',
      renderContent: ({d}) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => approveMutation.mutate({id: d.id})}
            disabled={approveMutation.isPending}
          >
            Approve
          </Button>
          <Button
            size="sm"
            onClick={() => {
              // eslint-disable-next-line no-alert
              const notes = prompt('Rejection reason:');
              if (notes) {
                rejectMutation.mutate({id: d.id, notes});
              }
            }}
            disabled={rejectMutation.isPending}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Admin</h1>
      <Card>
        <Table columns={columns} data={changeRequests} propertyForKey="id" />
      </Card>
    </div>
  );
}
