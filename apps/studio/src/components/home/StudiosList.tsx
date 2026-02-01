import {trpc} from '@/lib/trpc';

interface Studio {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

interface StudiosListProps {
  studios: Studio[];
  isLoading: boolean;
  onDelete: () => void;
}

export function StudiosList({
  studios,
  isLoading,
  onDelete,
}: StudiosListProps) {
  const deleteStudio = trpc.studio.delete.useMutation({
    onSuccess: onDelete,
  });

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-md">
      <h2 className="text-lg font-semibold text-white mb-4">
        Your Studios
      </h2>
      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : studios.length === 0 ? (
        <p className="text-gray-500">No studios yet</p>
      ) : (
        <ul className="space-y-2">
          {studios.map((org) => (
            <li
              key={org.id}
              className="flex justify-between items-center bg-gray-800 p-3 rounded"
            >
              <div>
                <p className="text-white font-medium">
                  {org.name}
                  {org.role && (
                    <span className="ml-2 text-xs bg-(--color-primary-600) px-2 py-0.5 rounded">
                      {org.role}
                    </span>
                  )}
                </p>
                <p className="text-gray-500 text-sm">/{org.slug}</p>
              </div>
              {org.role === 'OWNER' && (
                <button
                  onClick={() => deleteStudio.mutate({id: org.id})}
                  disabled={deleteStudio.isPending}
                  className="text-(--fg-error) hover:opacity-80 text-sm disabled:opacity-50"
                >
                  {deleteStudio.isPending ? '...' : 'Delete'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
