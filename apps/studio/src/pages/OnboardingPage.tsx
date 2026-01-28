import {useState} from 'react';
import {useNavigate} from 'react-router';
import {Button} from '@play/pylon';
import {trpc} from '@/lib/trpc';

/**
 * Onboarding page for users who don't have any organizations yet.
 * Guides them through creating their first organization.
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const utils = trpc.useUtils();

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (data) => {
      // Invalidate the me query to refresh organizations list
      utils.me.get.invalidate();
      // Navigate to the new organization
      navigate(`/${data.slug}`);
    },
  });

  // Auto-generate slug from name if user hasn't manually edited it
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && slug) {
      createOrg.mutate({name, slug});
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-[var(--primary-active)] to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Play.link!
          </h1>
          <p className="text-gray-200">
            Let's create your first organization to get started.
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="org-name"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Organization Name
              </label>
              <input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Game Studio"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the name that will be displayed to your team.
              </p>
            </div>

            <div>
              <label
                htmlFor="org-slug"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                URL Slug
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">play.link/</span>
                <input
                  id="org-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '')
                        .slice(0, 50),
                    );
                  }}
                  placeholder="my-studio"
                  required
                  pattern="[a-z0-9-]+"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            {createOrg.error && (
              <p className="text-[var(--fg-error)] text-sm bg-[var(--error)]/10 p-3 rounded-lg">
                {createOrg.error.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={createOrg.isPending || !name || !slug}
              style={{width: '100%'}}
            >
              {createOrg.isPending ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          You can always create more organizations later.
        </p>
      </div>
    </div>
  );
}
