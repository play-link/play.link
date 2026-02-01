import {
  ArrowLeftIcon,
  CopyIcon,
  GlobeIcon,
  MousePointerClickIcon,
  PauseIcon,
  PlayIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useNavigate, useParams} from 'react-router';
import styled from 'styled-components';
import {Button, Loading, useSnackbar} from '@play/pylon';
import {PageLayout} from '@/components/layout';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

type DateRange = '7' | '30' | '90';

interface SummaryData {
  total_clicks: number;
  unique_visitors: number;
}

interface TimeseriesRow {
  day: string;
  total_clicks: number;
  unique_visitors: number;
}

interface ReferrerRow {
  referrer: string;
  total: number;
}

interface CountryRow {
  country: string;
  total: number;
}

export function CampaignDetailPage() {
  const {campaignId} = useParams<{campaignId: string}>();
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();
  const [days, setDays] = useState<DateRange>('30');

  const {data: campaign, isLoading} = trpc.campaign.get.useQuery(
    {id: campaignId!},
    {enabled: !!campaignId},
  );

  const queryInput = {campaignId: campaignId!, days};

  const {data: summary} = trpc.campaign.summary.useQuery(queryInput, {
    enabled: !!campaignId,
  });
  const {data: timeseries} = trpc.campaign.timeseries.useQuery(queryInput, {
    enabled: !!campaignId,
  });
  const {data: referrers} = trpc.campaign.topReferrers.useQuery(queryInput, {
    enabled: !!campaignId,
  });
  const {data: countries} = trpc.campaign.topCountries.useQuery(queryInput, {
    enabled: !!campaignId,
  });

  const summaryData = summary as SummaryData | undefined;
  const timeseriesData = timeseries as TimeseriesRow[] | undefined;
  const referrersData = referrers as ReferrerRow[] | undefined;
  const countriesData = countries as CountryRow[] | undefined;

  const updateMutation = trpc.campaign.update.useMutation({
    onSuccess: () => {
      utils.campaign.get.invalidate({id: campaignId!});
      utils.campaign.listByStudio.invalidate({studioId: activeStudio.id});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const deleteMutation = trpc.campaign.delete.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Campaign deleted', severity: 'success'});
      navigate(`/${activeStudio.slug}/campaigns`);
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const toggleStatus = () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({
      id: campaign.id,
      gameId: campaign.game_id,
      status: newStatus as 'active' | 'paused',
    });
    showSnackbar({
      message: newStatus === 'active' ? 'Campaign resumed' : 'Campaign paused',
      severity: 'success',
    });
  };

  const handleDelete = () => {
    if (!campaign) return;
    // eslint-disable-next-line no-alert
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate({id: campaign.id, gameId: campaign.game_id});
  };

  const copyLink = () => {
    if (!campaign) return;
    const url = `https://play.link/g/${campaign.game_slug}?c=${campaign.slug}`;
    navigator.clipboard.writeText(url);
    showSnackbar({message: 'Link copied', severity: 'success'});
  };

  if (isLoading || !campaign) {
    return (
      <PageLayout>
        <PageLayout.Header title="Campaign" />
        <PageLayout.Content>
          <LoadingContainer>
            <Loading size="lg" />
          </LoadingContainer>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  const trackingUrl = `https://play.link/g/${campaign.game_slug}?c=${campaign.slug}`;

  return (
    <PageLayout>
      <PageLayout.Header title={campaign.name}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/${activeStudio.slug}/campaigns`)}
        >
          <ArrowLeftIcon size={16} className="mr-2" />
          Back
        </Button>
      </PageLayout.Header>

      <PageLayout.Content>
        <Container>
          <HeaderRow>
            <HeaderInfo>
              <StatusBadge $active={campaign.status === 'active'}>
                {campaign.status}
              </StatusBadge>
              <GameLabel>{campaign.game_title}</GameLabel>
              {campaign.destination !== 'game_page' && (
                <DestLabel>
                  → {campaign.destination === 'custom'
                    ? campaign.destination_url
                    : campaign.destination}
                </DestLabel>
              )}
            </HeaderInfo>
            <HeaderActions>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                <CopyIcon size={14} className="mr-2" />
                Copy link
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleStatus}>
                {campaign.status === 'active' ? (
                  <><PauseIcon size={14} className="mr-2" /> Pause</>
                ) : (
                  <><PlayIcon size={14} className="mr-2" /> Resume</>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                <Trash2Icon size={14} className="mr-2" />
                Delete
              </Button>
            </HeaderActions>
          </HeaderRow>

          <TrackingUrlBox>
            <TrackingUrlLabel>Tracking URL</TrackingUrlLabel>
            <TrackingUrl>{trackingUrl}</TrackingUrl>
          </TrackingUrlBox>

          <StatsHeader>
            <DateRangeSelector>
              {(['7', '30', '90'] as const).map((d) => (
                <Button
                  key={d}
                  variant="nav"
                  size="sm"
                  className={days === d ? 'active' : ''}
                  onClick={() => setDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </DateRangeSelector>
          </StatsHeader>

          <SummaryGrid>
            <SummaryCard>
              <SummaryIcon>
                <MousePointerClickIcon size={20} />
              </SummaryIcon>
              <SummaryValue>{summaryData?.total_clicks ?? 0}</SummaryValue>
              <SummaryLabel>Total Clicks</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryIcon>
                <UsersIcon size={20} />
              </SummaryIcon>
              <SummaryValue>{summaryData?.unique_visitors ?? 0}</SummaryValue>
              <SummaryLabel>Unique Visitors</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryIcon>
                <GlobeIcon size={20} />
              </SummaryIcon>
              <SummaryValue>
                {countriesData?.[0]?.country ?? '—'}
              </SummaryValue>
              <SummaryLabel>Top Country</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          {timeseriesData && timeseriesData.length > 0 && (
            <Section>
              <SectionTitle>Clicks Over Time</SectionTitle>
              <BarChartContainer>
                <BarChart data={timeseriesData} />
              </BarChartContainer>
            </Section>
          )}

          <ColumnsGrid>
            {referrersData && referrersData.length > 0 && (
              <Section>
                <SectionTitle>
                  <GlobeIcon size={16} /> Top Referrers
                </SectionTitle>
                <RankList>
                  {referrersData.map((r, i) => (
                    <RankItem key={i}>
                      <RankLabel>{r.referrer}</RankLabel>
                      <RankValue>{r.total}</RankValue>
                    </RankItem>
                  ))}
                </RankList>
              </Section>
            )}

            {countriesData && countriesData.length > 0 && (
              <Section>
                <SectionTitle>
                  <GlobeIcon size={16} /> Top Countries
                </SectionTitle>
                <RankList>
                  {countriesData.map((c, i) => (
                    <RankItem key={i}>
                      <RankLabel>{c.country}</RankLabel>
                      <RankValue>{c.total}</RankValue>
                    </RankItem>
                  ))}
                </RankList>
              </Section>
            )}
          </ColumnsGrid>

          {!timeseriesData?.length &&
            !referrersData?.length &&
            (summaryData?.total_clicks ?? 0) === 0 && (
              <EmptyState>
                <EmptyText>No clicks yet</EmptyText>
                <EmptySubtext>
                  Share your tracking link to start collecting data.
                </EmptySubtext>
              </EmptyState>
            )}
        </Container>
      </PageLayout.Content>
    </PageLayout>
  );
}

function BarChart({data}: {data: {day: string; total_clicks: number}[]}) {
  const entries = [...data].sort(([a], [b]) =>
    String(a).localeCompare(String(b)),
  );
  const max = Math.max(...entries.map((e) => e.total_clicks), 1);

  return (
    <BarChartGrid>
      {entries.map((entry) => (
        <BarColumn key={entry.day}>
          <BarFill style={{height: `${(entry.total_clicks / max) * 100}%`}} />
          <BarLabel>
            {new Date(entry.day).toLocaleDateString('en', {
              month: 'short',
              day: 'numeric',
            })}
          </BarLabel>
        </BarColumn>
      ))}
    </BarChartGrid>
  );
}

// --- Styles ---

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24rem;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-3);
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const HeaderActions = styled.div`
  display: flex;
  gap: var(--spacing-2);

  button {
    gap: var(--spacing-1);
  }
`;

const GameLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;

const DestLabel = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
`;

const StatusBadge = styled.span<{$active: boolean}>`
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
  background: ${({$active}) =>
    $active ? 'var(--color-success-100, #dcfce7)' : 'var(--bg-muted)'};
  color: ${({$active}) =>
    $active ? 'var(--color-success-700, #15803d)' : 'var(--fg-muted)'};
`;

const TrackingUrlBox = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3) var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const TrackingUrlLabel = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
  font-weight: var(--font-weight-medium);
`;

const TrackingUrl = styled.code`
  font-size: var(--text-sm);
  color: var(--fg);
  font-family: var(--font-mono, monospace);
  word-break: break-all;
`;

const StatsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const DateRangeSelector = styled.div`
  display: flex;
  gap: var(--spacing-1);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-4);
`;

const SummaryCard = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const SummaryIcon = styled.div`
  color: var(--fg-subtle);
  margin-bottom: var(--spacing-1);
`;

const SummaryValue = styled.span`
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--fg);
`;

const SummaryLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;

const Section = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
`;

const SectionTitle = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  margin: 0 0 var(--spacing-3);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const ColumnsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
`;

const RankList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const RankItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-1) 0;
`;

const RankLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--fg);
`;

const RankValue = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg-muted);
  font-variant-numeric: tabular-nums;
`;

const BarChartContainer = styled.div`
  height: 10rem;
`;

const BarChartGrid = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100%;
  padding-bottom: 1.5rem;
`;

const BarColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  position: relative;
`;

const BarFill = styled.div`
  width: 100%;
  background: var(--color-primary-500);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  min-height: 2px;
  transition: height 0.2s;
`;

const BarLabel = styled.span`
  position: absolute;
  bottom: -1.25rem;
  font-size: 0.625rem;
  color: var(--fg-subtle);
  white-space: nowrap;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 16rem;
  text-align: center;
`;

const EmptyText = styled.p`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  margin: 0;
`;

const EmptySubtext = styled.p`
  font-size: var(--text-base);
  color: var(--fg-subtle);
  margin: var(--spacing-2) 0 0;
`;
