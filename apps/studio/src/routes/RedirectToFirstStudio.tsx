import {Navigate, useLocation} from 'react-router-dom';
import {useAppContext} from '@/lib/app-context';

/**
 * Redirects to the user's first studio.
 * Used when accessing "/" to automatically select a studio.
 */
export function RedirectToFirstStudio() {
  const {me, isLoading} = useAppContext();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (me && me.studios.length > 0) {
    return (
      <Navigate
        to={`/${me.studios[0].slug}${location.search || ''}`}
        replace
      />
    );
  }

  // No studios - redirect to onboarding to create first studio
  return <Navigate to="/onboarding" replace />;
}
