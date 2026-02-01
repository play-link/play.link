import {createBrowserRouter, Navigate} from 'react-router-dom';
import {AdminGuard} from '@/components';
import {GameEditor, GameOverview, GamePreview, GameSettings, GameUpdateDetail, GameUpdates} from '@/components/games';
import {
  AdminPage,
  AnalyticsPage,
  AudiencePage,
  AuthCallbackPage,
  BillingSettingsPage,
  CampaignDetailPage,
  CampaignsPage,
  DomainsSettingsPage,
  GamePage,
  GamesPage,
  LoginPage,
  OnboardingPage,
  StudioSettingsPage,
  TeamSettingsPage,
} from '@/pages';
import {StudioLayout} from './StudioLayout';
import {ProtectedRoute} from './ProtectedRoute';
import {RedirectToFirstStudio} from './RedirectToFirstStudio';

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
        element: <RedirectToFirstStudio />,
      },
      {
        path: '/:studioSlug',
        element: <StudioLayout />,
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
                path: 'updates',
                element: <GameUpdates />,
              },
              {
                path: 'updates/:updateId',
                element: <GameUpdateDetail />,
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
            path: 'campaigns/:campaignId',
            element: <CampaignDetailPage />,
          },
          {
            path: 'audience',
            element: <AudiencePage />,
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
