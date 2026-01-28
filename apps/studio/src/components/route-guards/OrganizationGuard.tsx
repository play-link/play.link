import type {PropsWithChildren} from 'react';
import {useEffect} from 'react';
import {useNavigate, useParams} from 'react-router';
import {Loading} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';

/**
 * OrganizationGuard ensures an active organization is selected for organization routes.
 *
 * Behavior:
 * - Extracts organization slug from URL and verifies it against user's available organizations.
 * - Sets the active organization based on URL slug or defaults to the first organization available.
 * - Redirects appropriately if the slug is missing or invalid.
 * - Cleans up by resetting the active organization when component unmounts.
 */
export function OrganizationGuard({children}: PropsWithChildren) {
  const navigate = useNavigate();
  const urlParams = useParams<{orgSlug?: string}>();
  const {
    activeOrganization,
    setActiveOrganization,
    me: {organizations},
  } = useAppContext(ContextLevel.Authenticated);

  useEffect(() => {
    if (organizations.length < 1) {
      // TODO: Redirect to a "no organizations" page or create org flow
      return;
    }

    if (urlParams.orgSlug) {
      const org = organizations.find((o) => o.slug === urlParams.orgSlug);
      if (org) {
        setActiveOrganization(org);
        return;
      }
    }

    // Redirect to the first organization if slug is invalid or missing
    navigate(`/${organizations[0].slug}`, {replace: true});
  }, [urlParams.orgSlug, organizations, setActiveOrganization, navigate]);

  useEffect(() => {
    return () => {
      // When leaving organization routes, clear the active organization
      setActiveOrganization(null);
    };
  }, [setActiveOrganization]);

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <Loading size="lg" />
      </div>
    );
  }

  return children;
}
