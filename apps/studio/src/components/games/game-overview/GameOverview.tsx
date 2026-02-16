import {useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router';
import {DomainStatus} from '@play/supabase-client';
import type {Tables} from '@play/supabase-client';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';
import type {GameOutletContext} from '@/pages/GamePage';
import {ShareOverlay} from '../ShareOverlay';
import {LeftColumn, OverviewGrid, RightColumn} from './styles';
import {OverviewActionsPanel} from './OverviewActionsPanel';
import {OverviewHeroCard} from './OverviewHeroCard';
import {OverviewLatestUpdateCard} from './OverviewLatestUpdateCard';
import {OverviewReadinessCard} from './OverviewReadinessCard';
import {OverviewStatsCard} from './OverviewStatsCard';
import type {LatestGameUpdate, SummaryRow} from './types';
import {computePageCompleteness} from './utils';
import {VisibilityConfirmDialog} from './VisibilityConfirmDialog';

export function GameOverview() {
  const game = useOutletContext<GameOutletContext>();
  const navigate = useNavigate();
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'unpublish' | null>(null);

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((page) => page.is_primary);
  const isPublished = primaryPage?.visibility === 'PUBLISHED';
  const primaryRequestedSlug = (primaryPage as Record<string, unknown> | undefined)?.requested_slug as string | undefined;
  const primarySlug = primaryRequestedSlug || primaryPage?.slug || '';
  const playLinkBase = import.meta.env.VITE_PLAY_LINK_URL || 'https://play.link';
  const gameUrl = primaryPage ? `${playLinkBase}/${primaryPage.slug}` : '';

  const utils = trpc.useUtils();

  const {data: analyticsSummary} = trpc.analytics.summary.useQuery({
    gameId: game.id,
    days: '30',
  });
  const {data: subscriberData} = trpc.gameSubscriber.count.useQuery({
    gameId: game.id,
  });
  const {data: latestUpdates} = trpc.gameUpdate.list.useQuery({
    gameId: game.id,
    limit: 1,
  });
  const {data: customDomains = []} = trpc.customDomain.listByGame.useQuery({
    gameId: game.id,
  });
  const {data: slugCheck} = trpc.gamePage.checkSlug.useQuery(
    {slug: primarySlug},
    {enabled: primarySlug.length >= 3},
  );

  const summary = analyticsSummary as SummaryRow[] | undefined;
  const pageViews = summary?.find((entry) => entry.event_type === 'page_view')?.total ?? 0;
  const linkClicks = summary?.find((entry) => entry.event_type === 'link_click')?.total ?? 0;
  const ctr = pageViews > 0 ? ((linkClicks / pageViews) * 100).toFixed(1) : '0';
  const subscribers = subscriberData?.count ?? 0;
  const latestUpdate = (latestUpdates?.[0] ?? null) as LatestGameUpdate | null;
  const completeness = computePageCompleteness(game);
  const gameAny = game as Record<string, unknown>;
  const gameIsVerified = gameAny.is_verified === true;
  const gameVerificationStatus = `${gameAny.verification_status || ''}`.toLowerCase();
  const hasVerifyingDomain = customDomains.some(
    (domain) => domain.status === DomainStatus.VERIFYING,
  );
  const requiresSlugVerification = slugCheck?.requiresVerification === true;
  const isVerifyingOwnership = gameVerificationStatus === 'verifying' || hasVerifyingDomain;
  const canPublish = !requiresSlugVerification || gameIsVerified;
  const publishState: 'draft' | 'verifying' | 'live'
    = isPublished ? 'live' : isVerifyingOwnership ? 'verifying' : 'draft';
  const publishDisabledReason: 'not_verified' | 'verifying' | null
    = isPublished
      ? null
      : isVerifyingOwnership
        ? 'verifying'
        : canPublish
          ? null
          : 'not_verified';

  const publish = trpc.gamePage.publish.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
    },
  });
  const unpublish = trpc.gamePage.unpublish.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
      setConfirmAction(null);
    },
  });

  const handleConfirmVisibility = () => {
    if (!primaryPage) return;
    if (confirmAction === 'unpublish') {
      unpublish.mutate({pageId: primaryPage.id});
    }
  };

  return (
    <>
      <OverviewGrid>
        <LeftColumn>
          <OverviewHeroCard
            game={game}
            primaryPage={primaryPage}
            publishState={publishState}
            canPublish={canPublish}
            publishDisabledReason={publishDisabledReason}
            isPublishing={publish.isPending}
            onShareClick={() => setShareOpen(true)}
            onPublish={() => primaryPage && publish.mutate({pageId: primaryPage.id})}
            onVerifyNow={() => navigate('settings', {relative: 'path'})}
            onRequestUnpublish={() => setConfirmAction('unpublish')}
          />
          <OverviewStatsCard
            stats={{pageViews, linkClicks, ctr, subscribers}}
            onOpenAnalytics={() =>
              navigate(`/${activeStudio.slug}/analytics?gameId=${game.id}`)
            }
          />
          <OverviewLatestUpdateCard
            latestUpdate={latestUpdate}
            onOpenUpdates={() => navigate('updates', {relative: 'path'})}
            onOpenUpdate={(updateId) =>
              navigate(`updates/${updateId}`, {relative: 'path'})
            }
          />
        </LeftColumn>

        <RightColumn>
          <OverviewActionsPanel
            isPublished={isPublished}
            hasPrimaryPage={!!primaryPage}
            onDesignPage={() => navigate('design', {relative: 'path'})}
            onPreviewPage={() => navigate('preview', {relative: 'path'})}
            onViewPublicPage={() =>
              primaryPage && window.open(`${playLinkBase}/${primaryPage.slug}`, '_blank')
            }
            onOpenPressKit={() =>
              primaryPage
                && window.open(
                  `${playLinkBase}/${primaryPage.slug}/press-kit`,
                  '_blank',
                )
            }
          />
          <OverviewReadinessCard completeness={completeness} />
        </RightColumn>
      </OverviewGrid>

      {shareOpen && gameUrl && (
        <ShareOverlay
          gameUrl={gameUrl}
          gameTitle={game.title}
          onClose={() => setShareOpen(false)}
        />
      )}

      <VisibilityConfirmDialog
        confirmAction={confirmAction}
        isPending={publish.isPending || unpublish.isPending}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmVisibility}
      />
    </>
  );
}
