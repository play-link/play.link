import {createBrowserRouter, Navigate} from 'react-router-dom';
import {AdminGuard} from '@/components';
import {
  AdminPage,
  AnalyticsPage,
  AuthCallbackPage,
  BillingSettingsPage,
  CampaignsPage,
  DomainsSettingsPage,
  GameEditorPage,
  GamesPage,
  LoginPage,
  OnboardingPage,
  StudioSettingsPage,
  TeamSettingsPage,
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
            element: <GamesPage />,
          },
          {
            path: 'games',
            element: <GamesPage />,
          },
          {
            path: 'games/:gameId',
            element: <GameEditorPage />,
          },
          {
            path: 'campaigns',
            element: <CampaignsPage />,
          },
          {
            path: 'analytics',
            element: <AnalyticsPage />,
          },
          {
            path: 'settings/studio',
            element: <StudioSettingsPage />,
          },
          {
            path: 'settings/team',
            element: <TeamSettingsPage />,
          },
          {
            path: 'settings/domains',
            element: <DomainsSettingsPage />,
          },
          {
            path: 'settings/billing',
            element: <BillingSettingsPage />,
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
