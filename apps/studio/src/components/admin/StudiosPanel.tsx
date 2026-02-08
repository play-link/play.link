import {Badge, Button, Card, Table} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib';

interface Studio {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
}

interface StudiosPanelProps {
  onUpdate: () => void;
}

export function StudiosPanel({onUpdate}: StudiosPanelProps) {
  const {data: studios = [], isLoading} = trpc.admin.listStudios.useQuery({});

  const setVerifiedMutation = trpc.admin.setStudioVerified.useMutation({
    onSuccess: onUpdate,
  });

  const columns: TableColumn<Studio>[] = [
    {
      title: 'Studio',
      accessor: 'name',
      renderContent: ({d}) => (
        <div className="flex items-center gap-3">
          {d.avatar_url ? (
            <img
              src={d.avatar_url}
              alt={d.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-(--bg-muted) flex items-center justify-center text-xs font-semibold">
              {d.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium">{d.name}</div>
            <div className="text-sm text-(--fg-subtle)">@{d.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      accessor: 'is_verified',
      renderContent: ({d}) => (
        <Badge intent={d.is_verified ? 'success' : 'warning'}>
          {d.is_verified ? 'Verified' : 'Unverified'}
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
        <Button
          variant={d.is_verified ? 'ghost' : 'primary'}
          size="sm"
          onClick={() =>
            setVerifiedMutation.mutate({
              studioId: d.id,
              isVerified: !d.is_verified,
            })
          }
          disabled={setVerifiedMutation.isPending}
        >
          {d.is_verified ? 'Revoke' : 'Verify'}
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return <div className="text-(--fg-subtle)">Loading studios...</div>;
  }

  return (
    <Card>
      <Table columns={columns} data={studios} propertyForKey="id" />
    </Card>
  );
}
