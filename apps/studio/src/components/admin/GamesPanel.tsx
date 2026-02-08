import {Badge, Button, Card, Table} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib';

interface Game {
  id: string;
  title: string;
  cover_url: string | null;
  is_verified: boolean;
  created_at: string;
  owner_studio: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface GamesPanelProps {
  onUpdate: () => void;
}

export function GamesPanel({onUpdate}: GamesPanelProps) {
  const {data: games = [], isLoading} = trpc.admin.listGames.useQuery({});

  const setVerifiedMutation = trpc.admin.setGameVerified.useMutation({
    onSuccess: onUpdate,
  });

  const columns: TableColumn<Game>[] = [
    {
      title: 'Game',
      accessor: 'title',
      renderContent: ({d}) => (
        <div className="flex items-center gap-3">
          {d.cover_url ? (
            <img
              src={d.cover_url}
              alt={d.title}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-(--bg-muted) flex items-center justify-center text-xs font-semibold">
              {d.title.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium">{d.title}</div>
            {d.owner_studio && (
              <div className="text-sm text-(--fg-subtle)">
                by @{d.owner_studio.slug}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Studio',
      accessor: 'owner_studio',
      renderContent: ({d}) => (
        <span className="text-sm">
          {d.owner_studio?.name ?? 'Unknown'}
        </span>
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
              gameId: d.id,
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
    return <div className="text-(--fg-subtle)">Loading games...</div>;
  }

  return (
    <Card>
      <Table columns={columns} data={games} propertyForKey="id" />
    </Card>
  );
}
