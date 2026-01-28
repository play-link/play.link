import {useState} from 'react';
import {trpc} from '@/lib/trpc';

export function HomePage() {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');

  // Fetch organizations - fully typed!
  const {data: orgs = [], isLoading, error} = trpc.organization.list.useQuery();

  // Mutations with automatic type inference
  const utils = trpc.useUtils();

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: () => {
      setSlug('');
      setName('');
      utils.organization.list.invalidate();
    },
  });

  const deleteOrg = trpc.organization.delete.useMutation({
    onSuccess: () => {
      utils.organization.list.invalidate();
    },
  });

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    createOrg.mutate({slug, name});
  };

  return (
    <div className="p-8">
      {/* Create Org Form */}
      <div className="bg-slate-800 rounded-lg p-6 max-w-md mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Create Organization
        </h2>
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-studio"
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-purple-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Game Studio"
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-purple-500 focus:outline-none"
              required
            />
          </div>
          {(error || createOrg.error) && (
            <p className="text-red-400 text-sm">
              {error?.message || createOrg.error?.message}
            </p>
          )}
          <button
            type="submit"
            disabled={createOrg.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {createOrg.isPending ? 'Creating...' : 'Create Organization'}
          </button>
        </form>
      </div>

      {/* Orgs List */}
      <div className="bg-slate-800 rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-semibold text-white mb-4">
          Your Organizations
        </h2>
        {isLoading ? (
          <p className="text-slate-400">Loading...</p>
        ) : orgs.length === 0 ? (
          <p className="text-slate-400">No organizations yet</p>
        ) : (
          <ul className="space-y-2">
            {orgs.map((org) => (
              <li
                key={org.id}
                className="flex justify-between items-center bg-slate-700 p-3 rounded"
              >
                <div>
                  <p className="text-white font-medium">
                    {org.name}
                    {org.role && (
                      <span className="ml-2 text-xs bg-purple-600 px-2 py-0.5 rounded">
                        {org.role}
                      </span>
                    )}
                  </p>
                  <p className="text-slate-400 text-sm">/{org.slug}</p>
                </div>
                {org.role === 'OWNER' && (
                  <button
                    onClick={() => deleteOrg.mutate({id: org.id})}
                    disabled={deleteOrg.isPending}
                    className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                  >
                    {deleteOrg.isPending ? '...' : 'Delete'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
