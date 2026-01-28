import {createBrowserRouter, Navigate} from 'react-router-dom';
import {AdminGuard} from '@/components';
import {
  AdminPage,
  AuthCallbackPage,
  HomePage,
  LoginPage,
  MembersPage,
  OnboardingPage,
  SettingsPage,
} from '@/pages';
import {OrganizationLayout} from './OrganizationLayout';
import {ProtectedRoute} from './ProtectedRoute';
import {RedirectToFirstOrg} from './RedirectToFirstOrg';

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
