import {
  BarChart3Icon,
  EyeIcon,
  GlobeIcon,
  MonitorIcon,
  MousePointerClickIcon,
  SmartphoneIcon,
  TabletIcon,
  UsersIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Button, Loading} from '@play/pylon';
import {PageLayout} from '@/components/layout';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

type DateRange = '7' | '30' | '90';

interface SummaryRow {
  page_views: number;
  unique_visitors: number;
  link_clicks: number;
  follows: number;
}

interface TimeseriesRow {
  day: string;
  page_views: number;
  link_clicks: number;
  follows: number;
}

interface TopGameRow {
  game_id: string;
  title: string;
  page_views: number;
  link_clicks: number;
  follows: number;
}

interface ReferrerRow {
  referrer: string;
  total: number;
}

interface CountryRow {
  country: string;
  total: number;
}

interface PlatformRow {
  platform: string;
  total: number;
}

interface DeviceRow {
  device_type: string;
  total: number;
}

type ChartMetric = 'page_views' | 'link_clicks' | 'follows';

export function AnalyticsPage() {
  const {activeOrganization} = useAppContext(
    ContextLevel.AuthenticatedWithOrg,
  );
  const navigate = useNavigate();
  const [days, setDays] = useState<DateRange>('30');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('page_views');

  const queryInput = {organizationId: activeOrganization.id, days};

  const {data: summary, isLoading: summaryLoading} =
    trpc.orgAnalytics.summary.useQuery(queryInput);
  const {data: timeseries} =
    trpc.orgAnalytics.timeseries.useQuery(queryInput);
  const {data: topGames} = trpc.orgAnalytics.topGames.useQuery(queryInput);
  const {data: referrers} =
    trpc.orgAnalytics.topReferrers.useQuery(queryInput);
  const {data: countries} =
    trpc.orgAnalytics.topCountries.useQuery(queryInput);
  const {data: platforms} =
    trpc.orgAnalytics.topPlatforms.useQuery(queryInput);
  const {data: devices} = trpc.orgAnalytics.devices.useQuery(queryInput);

  const summaryData = (summary as SummaryRow[] | undefined)?.[0];
  const timeseriesTyped = timeseries as TimeseriesRow[] | undefined;
  const topGamesTyped = topGames as TopGameRow[] | undefined;
  const referrersTyped = referrers as ReferrerRow[] | undefined;
  const countriesTyped = countries as CountryRow[] | undefined;
  const platformsTyped = platforms as PlatformRow[] | undefined;
  const devicesTyped = devices as DeviceRow[] | undefined;

  const pageViews = summaryData?.page_views || 0;
  const uniqueVisitors = summaryData?.unique_visitors || 0;
  const linkClicks = summaryData?.link_clicks || 0;
  const ctr = pageViews > 0 ? ((linkClicks / pageViews) * 100).toFixed(1) : '0';
  const totalFollows = summaryData?.follows || 0;

  if (summaryLoading) {
    return (
      <PageLayout>
        <PageLayout.Header title="Analytics" />
        <PageLayout.Content>
          <LoadingContainer>
            <Loading size="lg" />
          </LoadingContainer>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  const hasData =
    pageViews > 0 ||
    timeseriesTyped?.length ||
    topGamesTyped?.length;

  return (
    <PageLayout>
      <PageLayout.Header title="Analytics">
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
      </PageLayout.Header>
      <PageLayout.Content>
        {!hasData ? (
          <EmptyState>
            <EmptyText>No analytics data yet</EmptyText>
            <EmptySubtext>
              Data will appear here once your game pages get visitors.
            </EmptySubtext>
          </EmptyState>
        ) : (
          <ContentGrid>
            {/* Overview Cards */}
            <SummaryGrid>
              <SummaryCard>
                <SummaryIcon>
                  <EyeIcon size={20} />
                </SummaryIcon>
                <SummaryValue>{pageViews.toLocaleString()}</SummaryValue>
                <SummaryLabel>Page Views</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryIcon>
                  <UsersIcon size={20} />
                </SummaryIcon>
                <SummaryValue>
                  {uniqueVisitors.toLocaleString()}
                </SummaryValue>
                <SummaryLabel>Unique Visitors</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryIcon>
                  <MousePointerClickIcon size={20} />
                </SummaryIcon>
                <SummaryValue>{linkClicks.toLocaleString()}</SummaryValue>
                <SummaryLabel>Link Clicks</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryIcon>
                  <BarChart3Icon size={20} />
                </SummaryIcon>
                <SummaryValue>{ctr}%</SummaryValue>
                <SummaryLabel>CTR</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryIcon>
                  <UsersIcon size={20} />
                </SummaryIcon>
                <SummaryValue>{totalFollows.toLocaleString()}</SummaryValue>
                <SummaryLabel>Total Follows</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryIcon>
                  <UsersIcon size={20} />
                </SummaryIcon>
                <SummaryValue>
                  {totalFollows.toLocaleString()}
                </SummaryValue>
                <SummaryLabel>Follows (in range)</SummaryLabel>
              </SummaryCard>
            </SummaryGrid>

            {/* Performance Chart */}
            {timeseriesTyped && timeseriesTyped.length > 0 && (
              <Section>
                <SectionHeader>
                  <SectionTitle>Performance</SectionTitle>
                  <ChartToggle>
                    <Button
                      variant="nav"
                      size="sm"
                      className={
                        chartMetric === 'page_views' ? 'active' : ''
                      }
                      onClick={() => setChartMetric('page_views')}
                    >
                      Page Views
                    </Button>
                    <Button
                      variant="nav"
                      size="sm"
                      className={
                        chartMetric === 'link_clicks' ? 'active' : ''
                      }
                      onClick={() => setChartMetric('link_clicks')}
                    >
                      Link Clicks
                    </Button>
                    <Button
                      variant="nav"
                      size="sm"
                      className={
                        chartMetric === 'follows' ? 'active' : ''
                      }
                      onClick={() => setChartMetric('follows')}
                    >
                      Follows
                    </Button>
                  </ChartToggle>
                </SectionHeader>
                <ChartContainer>
                  <LineChart data={timeseriesTyped} metric={chartMetric} />
                </ChartContainer>
              </Section>
            )}

            {/* Top Games Table */}
            {topGamesTyped && topGamesTyped.length > 0 && (
              <Section>
                <SectionTitle>Top Games</SectionTitle>
                <GamesTable>
                  <thead>
                    <tr>
                      <Th align="left">Game</Th>
                      <Th align="right">Page Views</Th>
                      <Th align="right">Link Clicks</Th>
                      <Th align="right">CTR</Th>
                      <Th align="right">Follows</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {topGamesTyped.map((game) => {
                      const gameCtr =
                        game.page_views > 0
                          ? (
                              (game.link_clicks / game.page_views) *
                              100
                            ).toFixed(1)
                          : '0';
                      return (
                        <GameRow
                          key={game.game_id}
                          onClick={() =>
                            navigate(
                              `/${activeOrganization.slug}/games/${game.game_id}/analytics`,
                            )
                          }
                        >
                          <Td align="left">
                            <GameTitle>{game.title}</GameTitle>
                          </Td>
                          <Td align="right">
                            {game.page_views.toLocaleString()}
                          </Td>
                          <Td align="right">
                            {game.link_clicks.toLocaleString()}
                          </Td>
                          <Td align="right">{gameCtr}%</Td>
                          <Td align="right">
                            {game.follows.toLocaleString()}
                          </Td>
                        </GameRow>
                      );
                    })}
                  </tbody>
                </GamesTable>
              </Section>
            )}

            {/* Traffic Breakdown */}
            <ColumnsGrid>
              {referrersTyped && referrersTyped.length > 0 && (
                <Section>
                  <SectionTitle>
                    <GlobeIcon size={16} /> Top Referrers
                  </SectionTitle>
                  <BreakdownList
                    items={referrersTyped.map((r) => ({
                      name: r.referrer,
                      count: r.total,
                    }))}
                  />
                </Section>
              )}

              {countriesTyped && countriesTyped.length > 0 && (
                <Section>
                  <SectionTitle>
                    <GlobeIcon size={16} /> Top Countries
                  </SectionTitle>
                  <BreakdownList
                    items={countriesTyped.map((c) => ({
                      name: c.country,
                      count: c.total,
                    }))}
                  />
                </Section>
              )}

              {platformsTyped && platformsTyped.length > 0 && (
                <Section>
                  <SectionTitle>
                    <MousePointerClickIcon size={16} /> Top Platforms
                  </SectionTitle>
                  <BreakdownList
                    items={platformsTyped.map((p) => ({
                      name: p.platform,
                      count: p.total,
                    }))}
                  />
                </Section>
              )}

              {devicesTyped && devicesTyped.length > 0 && (
                <Section>
                  <SectionTitle>
                    <MonitorIcon size={16} /> Devices
                  </SectionTitle>
                  <BreakdownList
                    items={devicesTyped.map((d) => ({
                      name: d.device_type,
                      count: d.total,
                      icon: <DeviceIcon type={d.device_type} />,
                    }))}
                  />
                </Section>
              )}
            </ColumnsGrid>
          </ContentGrid>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
}

// --- Breakdown List ---

function BreakdownList({
  items,
}: {
  items: {name: string; count: number; icon?: React.ReactNode}[];
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <RankList>
      {items.map((item, i) => {
        const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
        return (
          <RankItem key={i}>
            <RankLabel>
              {item.icon} {item.name}
            </RankLabel>
            <RankStats>
              <RankValue>{item.count.toLocaleString()}</RankValue>
              <RankPct>{pct}%</RankPct>
            </RankStats>
          </RankItem>
        );
      })}
    </RankList>
  );
}

// --- Line Chart ---

function LineChart({
  data,
  metric,
}: {
  data: TimeseriesRow[];
  metric: ChartMetric;
}) {
  const entries = data
    .map((row) => [row.day, row[metric]] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return (
      <EmptyChartText>No data for this metric in this period.</EmptyChartText>
    );
  }

  const max = Math.max(...entries.map(([, v]) => v), 1);
  const height = 160;
  const padX = 0;
  const padY = 16;
  const usableH = height - padY * 2;

  const points = entries.map(([, total], i) => {
    const x = padX + (i / Math.max(entries.length - 1, 1)) * (100 - padX * 2);
    const y = padY + usableH - (total / max) * usableH;
    return {x, y};
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <ChartSvg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-primary-500)"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      />
    </ChartSvg>
  );
}

// --- Device Icon ---

function DeviceIcon({type}: {type: string}) {
  switch (type) {
    case 'mobile':
      return <SmartphoneIcon size={14} />;
    case 'tablet':
      return <TabletIcon size={14} />;
    default:
      return <MonitorIcon size={14} />;
  }
}

// --- Styles ---

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24rem;
`;

const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
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

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-3);
`;

const SectionTitle = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  margin: 0 0 var(--spacing-3);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);

  ${SectionHeader} & {
    margin-bottom: 0;
  }
`;

const ChartToggle = styled.div`
  display: flex;
  gap: var(--spacing-1);
`;

const ChartContainer = styled.div`
  height: 10rem;
`;

const ChartSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

const EmptyChartText = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-subtle);
  text-align: center;
  padding: var(--spacing-8) 0;
  margin: 0;
`;

// Table styles

const GamesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th<{align: 'left' | 'right'}>`
  text-align: ${(p) => p.align};
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--fg-subtle);
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--border-muted);
`;

const Td = styled.td<{align: 'left' | 'right'}>`
  text-align: ${(p) => p.align};
  font-size: var(--text-sm);
  color: var(--fg);
  padding: var(--spacing-2) var(--spacing-3);
  font-variant-numeric: tabular-nums;
`;

const GameRow = styled.tr`
  cursor: pointer;
  &:hover {
    background: var(--bg-hover);
  }
`;

const GameTitle = styled.span`
  font-weight: var(--font-weight-medium);
`;

// Breakdown styles

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
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
`;

const RankStats = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const RankValue = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg-muted);
  font-variant-numeric: tabular-nums;
`;

const RankPct = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  font-variant-numeric: tabular-nums;
  min-width: 3rem;
  text-align: right;
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
