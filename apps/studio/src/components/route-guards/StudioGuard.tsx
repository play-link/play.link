import type {PropsWithChildren} from 'react';
import {useEffect} from 'react';
import {useNavigate, useParams} from 'react-router';
import {Loading} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';

/**
 * StudioGuard ensures an active studio is selected for studio routes.
 *
 * Behavior:
 * - Extracts studio slug from URL and verifies it against user's available studios.
 * - Sets the active studio based on URL slug or defaults to the first studio available.
 * - Redirects appropriately if the slug is missing or invalid.
 * - Cleans up by resetting the active studio when component unmounts.
 */
export function StudioGuard({children}: PropsWithChildren) {
  const navigate = useNavigate();
  const urlParams = useParams<{studioSlug?: string}>();
  const {
    activeStudio,
    setActiveStudio,
    me: {studios},
  } = useAppContext(ContextLevel.Authenticated);

  useEffect(() => {
    if (studios.length < 1) {
      // TODO: Redirect to a "no studios" page or create studio flow
      return;
    }

    if (urlParams.studioSlug) {
      const studio = studios.find((s) => s.slug === urlParams.studioSlug);
      if (studio) {
        setActiveStudio(studio);
        return;
      }
    }

    // Redirect to the first studio if slug is invalid or missing
    navigate(`/${studios[0].slug}`, {replace: true});
  }, [urlParams.studioSlug, studios, setActiveStudio, navigate]);

  useEffect(() => {
    return () => {
      // When leaving studio routes, clear the active studio
      setActiveStudio(null);
    };
  }, [setActiveStudio]);

  if (!activeStudio) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <Loading size="lg" />
      </div>
    );
  }

  return children;
}
