import {useState} from 'react';
import {useNavigate} from 'react-router';
import {Button} from '@play/pylon';
import {trpc} from '@/lib/trpc';

export function OnboardingForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const utils = trpc.useUtils();

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (data) => {
      utils.me.get.invalidate();
      navigate(`/${data.slug}`);
    },
  });

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
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
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
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Only lowercase letters, numbers, and hyphens.
          </p>
        </div>

        {createOrg.error && (
          <p className="text-(--fg-error) text-sm bg-(--error)/10 p-3 rounded-lg">
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
  );
}
