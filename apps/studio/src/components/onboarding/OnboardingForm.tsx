import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router';
import {Button} from '@play/pylon';
import {trpc} from '@/lib/trpc';

export function OnboardingForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [debouncedSlug, setDebouncedSlug] = useState('');

  const utils = trpc.useUtils();

  const createStudio = trpc.studio.create.useMutation({
    onSuccess: (data) => {
      utils.me.get.invalidate();
      navigate(`/${data.slug}`);
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 300);

    return () => clearTimeout(timer);
  }, [slug]);

  const {data: slugCheck, isFetching: isCheckingSlug} = trpc.studio.checkSlug.useQuery(
    {slug: debouncedSlug},
    {
      enabled: debouncedSlug.length >= 3,
      staleTime: 5000,
    },
  );

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
    if (canSubmit) {
      createStudio.mutate({name, slug});
    }
  };

  const isSlugValid
    = slug.length >= 3 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const isSlugCheckInProgress
    = isSlugValid && (slug !== debouncedSlug || isCheckingSlug);
  const isSlugAvailable = !isSlugCheckInProgress && slugCheck?.available === true;
  const requiresSlugVerification
    = isSlugAvailable && slugCheck?.requiresVerification === true;
  const canSubmit = !!name && isSlugValid && isSlugAvailable && !createStudio.isPending;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="studio-name"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Studio Name
          </label>
          <input
            id="studio-name"
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
            htmlFor="studio-slug"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            URL Slug
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">play.link/</span>
            <input
              id="studio-slug"
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
            {slug.length < 3 ? (
              'At least 3 characters. Lowercase letters, numbers, and hyphens.'
            ) : isSlugCheckInProgress ? (
              'Checking availability...'
            ) : requiresSlugVerification ? (
              <span className="text-amber-400">
                This slug is available but protected. You can create it, but admin verification is required before publishing.
              </span>
            ) : isSlugAvailable ? (
              <span className="text-green-400">This slug is available.</span>
            ) : (
              <span className="text-red-400">This slug is already taken.</span>
            )}
          </p>
        </div>

        {createStudio.error && (
          <p className="text-(--fg-error) text-sm bg-(--error)/10 p-3 rounded-lg">
            {createStudio.error.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          style={{width: '100%'}}
        >
          {createStudio.isPending ? 'Creating...' : 'Create Studio'}
        </Button>
      </form>
    </div>
  );
}
