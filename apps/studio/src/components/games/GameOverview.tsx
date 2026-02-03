import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  GamepadIcon,
  MousePointerClickIcon,
  PencilIcon,
  PercentIcon,
  ShareIcon,
  UsersIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button, DialogOverlay, DropdownMenu, IconButton} from '@play/pylon';
import type {Tables} from '@play/supabase-client';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import type {GameOutletContext} from '@/pages/GamePage';
import {trpc} from '@/lib/trpc';
import {ShareOverlay} from './ShareOverlay';

const STATUS_LABELS: Record<string, string> = {
  IN_DEVELOPMENT: 'In Development',
  UPCOMING: 'Upcoming',
  EARLY_ACCESS: 'Early Access',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
};

interface SummaryRow {
  event_type: string;
  total: number;
  unique_visitors: number;
}

function computePageCompleteness(game: GameOutletContext) {
  const checks = [
    {label: 'Title', done: !!game.title},
    {label: 'Summary', done: !!game.summary},
    {label: 'Description', done: !!game.description},
    {label: 'Cover image', done: !!game.cover_url},
    {label: 'Header image', done: !!game.header_url},
    {label: 'Trailer', done: !!game.trailer_url},
    {label: 'Genres', done: Array.isArray(game.genres) && game.genres.length > 0},
    {label: 'Platforms', done: Array.isArray(game.platforms) && game.platforms.length > 0},
  ];
  const completed = checks.filter((c) => c.done);
  const missing = checks.filter((c) => !c.done);
  const percentage = Math.round((completed.length / checks.length) * 100);
  return {percentage, missing, completed};
}

export function GameOverview() {
  const game = useOutletContext<GameOutletContext>();
  const navigate = useNavigate();
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | null>(null);

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);
  const isPublished = primaryPage?.visibility === 'PUBLISHED';
  const playLinkBase = import.meta.env.VITE_PLAY_LINK_URL || 'https://play.link';
  const gameUrl = primaryPage ? `${playLinkBase}/${primaryPage.slug}` : '';

  const utils = trpc.useUtils();

  // Data queries
  const {data: analyticsSummary} = trpc.analytics.summary.useQuery({gameId: game.id, days: '30'});
  const {data: subscriberData} = trpc.gameSubscriber.count.useQuery({gameId: game.id});
  const {data: latestUpdates} = trpc.gameUpdate.list.useQuery({gameId: game.id, limit: 1});

  // Derived values
  const summary = analyticsSummary as SummaryRow[] | undefined;
  const pageViews = summary?.find((s) => s.event_type === 'page_view')?.total ?? 0;
  const linkClicks = summary?.find((s) => s.event_type === 'link_click')?.total ?? 0;
  const ctr = pageViews > 0 ? ((linkClicks / pageViews) * 100).toFixed(1) : '0';
  const subscribers = subscriberData?.count ?? 0;
  const latestUpdate = latestUpdates?.[0] ?? null;
  const completeness = computePageCompleteness(game);

  // Mutations
  const publish = trpc.gamePage.publish.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
      setConfirmAction(null);
    },
  });

  const unpublish = trpc.gamePage.unpublish.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
      setConfirmAction(null);
    },
  });

  const handleConfirm = () => {
    if (!primaryPage) return;
    if (confirmAction === 'publish') {
      publish.mutate({pageId: primaryPage.id});
    } else if (confirmAction === 'unpublish') {
      unpublish.mutate({pageId: primaryPage.id});
    }
  };

  return (
    <>
      <OverviewGrid>
        {/* Left column */}
        <LeftColumn>
          <HeroCard>
            <HeroLeft>
              <CoverThumb>
                {game.cover_url ? (
                  <CoverImage src={game.cover_url} alt={game.title} />
                ) : (
                  <CoverPlaceholder>
                    <GamepadIcon size={32} />
                  </CoverPlaceholder>
                )}
              </CoverThumb>
              <HeroInfo>
                {primaryPage && (
                  <SlugRow>
                    <SlugTitle>play.link/{primaryPage.slug}</SlugTitle>
                    <IconButton icon={ShareIcon} variant="default" size="xs" onClick={() => setShareOpen(true)} aria-label="Share" />
                  </SlugRow>
                )}
                <MetaRow>
                  <MetaLabel>Visibility:</MetaLabel>
                  <DropdownMenu>
                    <PublishPill $published={isPublished}>
                      {isPublished ? 'Published' : 'Private'}
                      <ChevronDownIcon size={14} />
                    </PublishPill>
                    <DropdownContent>
                      {isPublished ? (
                        <DropdownItem onClick={() => setConfirmAction('unpublish')}>
                          Unpublish page
                        </DropdownItem>
                      ) : (
                        <DropdownItem onClick={() => setConfirmAction('publish')}>
                          Publish page
                        </DropdownItem>
                      )}
                    </DropdownContent>
                  </DropdownMenu>
                </MetaRow>
                <MetaSubline>
                  {[
                    STATUS_LABELS[game.status] || game.status,
                    ...(Array.isArray(game.genres) ? game.genres : []),
                    ...(Array.isArray(game.platforms) ? (game.platforms as string[]) : []),
                  ].join(' • ')}
                </MetaSubline>
              </HeroInfo>
            </HeroLeft>
          </HeroCard>
          <Card>
            <CardHeader>
              <CardTitle>Quick stats</CardTitle>
              <CardHeaderRight>
                <CardSubtitle>Last 30 days</CardSubtitle>
                <CardLink onClick={() => navigate(`/${activeStudio.slug}/analytics?gameId=${game.id}`)}>Open analytics →</CardLink>
              </CardHeaderRight>
            </CardHeader>
            <StatsGrid>
              <StatItem>
                <StatIcon><EyeIcon size={18} /></StatIcon>
                <StatValue>{pageViews.toLocaleString()}</StatValue>
                <StatLabel>Visits</StatLabel>
              </StatItem>
              <StatItem>
                <StatIcon><MousePointerClickIcon size={18} /></StatIcon>
                <StatValue>{linkClicks.toLocaleString()}</StatValue>
                <StatLabel>Clicks</StatLabel>
              </StatItem>
              <StatItem>
                <StatIcon><PercentIcon size={18} /></StatIcon>
                <StatValue>{ctr}%</StatValue>
                <StatLabel>CTR</StatLabel>
              </StatItem>
              <StatItem>
                <StatIcon><UsersIcon size={18} /></StatIcon>
                <StatValue>{subscribers.toLocaleString()}</StatValue>
                <StatLabel>Subscribers</StatLabel>
              </StatItem>
            </StatsGrid>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest update</CardTitle>
              <CardLink onClick={() => navigate('updates', {relative: 'path'})}>Open updates →</CardLink>
            </CardHeader>
            {latestUpdate ? (
              <UpdatePreview onClick={() => navigate(`updates/${latestUpdate.id}`, {relative: 'path'})}>
                <UpdateHeader>
                  <UpdateTitle>{latestUpdate.title}</UpdateTitle>
                  <UpdateBadge $status={latestUpdate.status}>
                    {latestUpdate.status === 'published' ? 'Published' : 'Draft'}
                  </UpdateBadge>
                </UpdateHeader>
                <UpdateDate>
                  {new Date(latestUpdate.created_at).toLocaleDateString('en', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </UpdateDate>
              </UpdatePreview>
            ) : (
              <EmptyState>
                <FileTextIcon size={24} strokeWidth={1.5} />
                <span>No updates yet</span>
              </EmptyState>
            )}
          </Card>
        </LeftColumn>

        {/* Right column */}
        <RightColumn>
          <DesignButton onClick={() => navigate('design', {relative: 'path'})}>
            <PencilIcon size={18} />
            Design page
          </DesignButton>

          {!isPublished && (
            <PreviewButton onClick={() => navigate('preview', {relative: 'path'})}>
              <ExternalLinkIcon size={16} />
              Preview page
            </PreviewButton>
          )}

          {primaryPage && (
            <PreviewButton
              as="a"
              href={`${playLinkBase}/${primaryPage.slug}/press-kit`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon size={16} />
              View press kit
            </PreviewButton>
          )}

          <Card>
            <CardTitle>Launch readiness</CardTitle>
            <PercentageRow>
              <PercentageLabel>{completeness.percentage}%</PercentageLabel>
            </PercentageRow>
            <ProgressTrack>
              <ProgressFill $percentage={completeness.percentage} />
            </ProgressTrack>
            <Checklist>
              {completeness.missing.map((item) => (
                <ChecklistItem key={item.label} $done={false}>
                  <CircleIcon size={14} />
                  {item.label}
                </ChecklistItem>
              ))}
              {completeness.completed.map((item) => (
                <ChecklistItem key={item.label} $done>
                  <CheckCircle2Icon size={14} />
                  {item.label}
                </ChecklistItem>
              ))}
            </Checklist>
          </Card>

        </RightColumn>
      </OverviewGrid>

      {shareOpen && gameUrl && (
        <ShareOverlay
          gameUrl={gameUrl}
          gameTitle={game.title}
          onClose={() => setShareOpen(false)}
        />
      )}

      <DialogOverlay
        opened={confirmAction !== null}
        setOpened={(open) => { if (!open) setConfirmAction(null); }}
        size="sm"
      >
        <ConfirmContent>
          <ConfirmTitle>
            {confirmAction === 'publish' ? 'Publish page?' : 'Unpublish page?'}
          </ConfirmTitle>
          <ConfirmDescription>
            {confirmAction === 'publish'
              ? 'Your game page will be live and visible to everyone.'
              : 'Your game page will no longer be visible to visitors.'}
          </ConfirmDescription>
          <ConfirmActions>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'unpublish' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirm}
              disabled={publish.isPending || unpublish.isPending}
            >
              {confirmAction === 'publish' ? 'Publish' : 'Unpublish'}
            </Button>
          </ConfirmActions>
        </ConfirmContent>
      </DialogOverlay>
    </>
  );
}

/* ── Layout ── */

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--spacing-4);
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

/* ── Hero Card ── */

const HeroCard = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3);
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--spacing-6);
`;

const HeroLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-6);
  min-width: 0;
`;

const CoverThumb = styled.div`
  width: 12.5rem;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-muted);
  flex-shrink: 0;
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CoverPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-subtle);
`;

const HeroInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  min-width: 0;
`;

const SlugRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const SlugTitle = styled.h2`
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const PublishPill = styled.button<{$published: boolean}>`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  background: ${(p) => (p.$published ? 'var(--color-green-600)' : 'rgba(0, 0, 0, 0.6)')};
  color: var(--white);
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
`;

const DropdownContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-1);
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--fg);
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s;

  &:hover {
    background: var(--bg-hover);
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const MetaLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;

const MetaSubline = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
`;

/* ── Cards ── */

const Card = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

const CardTitle = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const CardHeaderRight = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
`;

const CardSubtitle = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
`;

const CardLink = styled.button`
  font-size: var(--text-xs);
  color: var(--fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;

  &:hover {
    color: var(--fg);
  }
`;

/* ── Quick Stats ── */

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-4);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const StatIcon = styled.div`
  color: var(--fg-muted);
`;

const StatValue = styled.span`
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
`;

const StatLabel = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
`;

/* ── Latest Update ── */

const UpdatePreview = styled.button`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  background: var(--bg-muted);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;

  &:hover {
    background: var(--bg-hover);
  }
`;

const UpdateHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const UpdateTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg);
`;

const UpdateBadge = styled.span<{$status: string}>`
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  padding: 1px var(--spacing-2);
  border-radius: var(--radius-full);
  background: ${(p) => (p.$status === 'published' ? 'var(--color-green-600)' : 'var(--bg-muted)')};
  color: ${(p) => (p.$status === 'published' ? 'var(--white)' : 'var(--fg-muted)')};
`;

const UpdateDate = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6);
  color: var(--fg-subtle);
  font-size: var(--text-sm);
`;

/* ── Design Button ── */

const DesignButton = styled.button`
  width: 100%;
  padding: var(--spacing-4);
  background: var(--color-primary-600);
  color: var(--white);
  border: none;
  border-radius: var(--radius-xl);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.9;
  }
`;

const PreviewButton = styled.button`
  width: 100%;
  padding: var(--spacing-3);
  background: var(--bg-surface);
  color: var(--fg);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  transition: background-color 0.15s;

  &:hover {
    background: var(--bg-hover);
  }
`;

/* ── Page Completeness ── */

const PercentageRow = styled.div`
  display: flex;
  align-items: baseline;
`;

const PercentageLabel = styled.span`
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  background: var(--bg-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
`;

const ProgressFill = styled.div<{$percentage: number}>`
  width: ${(p) => p.$percentage}%;
  height: 100%;
  background: var(--color-primary-600);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
`;

const Checklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const ChecklistItem = styled.div<{$done: boolean}>`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: ${(p) => (p.$done ? 'var(--fg-subtle)' : 'var(--fg)')};
`;

/* ── Confirm Dialog ── */

const ConfirmContent = styled.div`
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const ConfirmTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const ConfirmDescription = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
`;

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
`;
