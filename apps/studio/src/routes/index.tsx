import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AdminGuard, OrganizationGuard } from '@/components';
import { SidebarLayout } from '@/layouts';
import { useAppContext } from '@/lib/app-context';
import {
  AdminPage,
  AuthCallbackPage,
  HomePage,
  LoginPage,
  MembersPage,
  OnboardingPage,
  SettingsPage,
} from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * Redirects to the user's first organization.
 * Used when accessing "/" to automatically select an org.
 */
function RedirectToFirstOrg() {
  const { me, isLoading } = useAppContext();

  if (isLoading) {
    return null;
  }

  if (me && me.organizations.length > 0) {
    return <Navigate to={`/${me.organizations[0].slug}`} replace />;
  }

  // No organizations - redirect to onboarding to create first org
  return <Navigate to="/onboarding" replace />;
}

/**
 * Layout for organization-scoped routes.
 * Wraps content with OrganizationGuard to ensure valid org context.
 */
function OrganizationLayout() {
  return (
    <OrganizationGuard>
      <SidebarLayout>
        <Outlet />
      </SidebarLayout>
    </OrganizationGuard>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/onboarding',
        element: <OnboardingPage />,
      },
      {
        path: '/admin',
        element: (
          <AdminGuard>
            <AdminPage />
          </AdminGuard>
        ),
      },
      {
        path: '/',
        element: <RedirectToFirstOrg />,
      },
      {
        path: '/:orgSlug',
        element: <OrganizationLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'members',
            element: <MembersPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
