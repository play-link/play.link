import {Navigate} from 'react-router-dom';
import {useAppContext} from '@/lib/app-context';

/**
 * Redirects to the user's first organization.
 * Used when accessing "/" to automatically select an org.
 */
export function RedirectToFirstOrg() {
  const {me, isLoading} = useAppContext();

  if (isLoading) {
    return null;
  }

  if (me && me.organizations.length > 0) {
    return <Navigate to={`/${me.organizations[0].slug}`} replace />;
  }

  // No organizations - redirect to onboarding to create first org
  return <Navigate to="/onboarding" replace />;
}
