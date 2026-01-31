import {createBrowserRouter, Navigate} from 'react-router-dom';
import {AdminGuard} from '@/components';
import {GameAnalytics, GameEditor, GameOverview, GamePreview, GameSettings} from '@/components/games';
import {
  AdminPage,
  AnalyticsPage,
  AuthCallbackPage,
  BillingSettingsPage,
  CampaignDetailPage,
  CampaignsPage,
  CreateCampaignPage,
  DomainsSettingsPage,
  GamePage,
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
            element: <GamePage />,
            children: [
              {
                index: true,
                element: <GameOverview />,
              },
              {
                path: 'analytics',
                element: <GameAnalytics />,
              },
              {
                path: 'settings',
                element: <GameSettings />,
              },
              {
                path: 'preview',
                element: <GamePreview />,
              },
              {
                path: 'design',
                element: <GameEditor />,
              },
            ],
          },
          {
            path: 'campaigns',
            element: <CampaignsPage />,
          },
          {
            path: 'campaigns/new',
            element: <CreateCampaignPage />,
          },
          {
            path: 'campaigns/:campaignId',
            element: <CampaignDetailPage />,
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
