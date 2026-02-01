import {useState} from 'react';
import {trpc} from '@/lib/trpc';

interface CreateStudioFormProps {
  onSuccess: () => void;
}

export function CreateStudioForm({
  onSuccess,
}: CreateStudioFormProps) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');

  const createStudio = trpc.studio.create.useMutation({
    onSuccess: () => {
      setSlug('');
      setName('');
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStudio.mutate({slug, name});
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-md mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">
        Create Studio
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-studio"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-(--primary) focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Game Studio"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-(--primary) focus:outline-none"
            required
          />
        </div>
        {createStudio.error && (
          <p className="text-(--fg-error) text-sm">{createStudio.error.message}</p>
        )}
        <button
          type="submit"
          disabled={createStudio.isPending}
          className="w-full bg-(--color-primary-600) hover:bg-(--color-primary-700) disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {createStudio.isPending ? 'Creating...' : 'Create Studio'}
        </button>
      </form>
    </div>
  );
}
