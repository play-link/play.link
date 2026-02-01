import {
  InfoIcon,
  MailIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import styled from 'styled-components';
import {Button, Loading, Select} from '@play/pylon';
import {PageLayout} from '@/components/layout';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

type DateRange = '7' | '30' | '90';
type ChartMetric = 'subscribers_gained' | 'unsubscribes' | 'net_growth';

interface SummaryData {
  total_subscribers: number;
  subscribers_gained: number;
  unsubscribes: number;
  net_growth: number;
  confirmed_count: number;
  pending_count: number;
}

interface TimeseriesRow {
  day: string;
  subscribers_gained: number;
  unsubscribes: number;
  net_growth: number;
}

interface GameRow {
  game_id: string;
  game_title: string;
  cover_url: string | null;
  total_subscribers: number;
  subscribers_gained: number;
  unsubscribes: number;
  net_growth: number;
}

export function AudiencePage() {
  const {activeStudio} = useAppContext(
    ContextLevel.AuthenticatedWithStudio,
  );
  const [days, setDays] = useState<DateRange>('30');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [chartMetric, setChartMetric] =
    useState<ChartMetric>('subscribers_gained');

  const {data: games = []} = trpc.game.list.useQuery({
    studioId: activeStudio.id,
  });

  const gameOptions = useMemo(
    () => [
      {label: 'All games', value: ''},
      ...games.map((g: any) => ({label: g.title, value: g.id})),
    ],
    [games],
  );

  const queryInput = {
    studioId: activeStudio.id,
    days,
    gameId: selectedGameId || undefined,
  };

  const {data: summary, isLoading: summaryLoading} =
    trpc.audience.summary.useQuery(queryInput);
  const {data: timeseries} = trpc.audience.timeseries.useQuery(queryInput);
  const {data: byGame} = trpc.audience.byGame.useQuery({
    studioId: activeStudio.id,
    days,
  });

  const s = summary as SummaryData | undefined;
  const ts = timeseries as TimeseriesRow[] | undefined;
  const gamesData = byGame as GameRow[] | undefined;

  const topGame = gamesData?.length
    ? gamesData.reduce((max, g) =>
        g.subscribers_gained > max.subscribers_gained ? g : max,
      )
    : null;

  const confirmRate =
    s && s.total_subscribers > 0
      ? ((s.confirmed_count / s.total_subscribers) * 100).toFixed(1)
      : '0';

  if (summaryLoading) {
    return (
      <PageLayout>
        <PageLayout.Header title="Audience" />
        <PageLayout.Content>
          <LoadingContainer>
            <Loading size="lg" />
          </LoadingContainer>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  const hasData = (s?.total_subscribers || 0) > 0;

  return (
    <PageLayout>
      <PageLayout.Header
        title="Audience"
        subtitle="People subscribed to updates for your games."
      >
        <HeaderActions>
          <GameFilterContainer>
            <Select
              value={selectedGameId}
              onChange={(e: any) => setSelectedGameId(e.target.value)}
              options={gameOptions}
            />
          </GameFilterContainer>
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
          <PrivacyHint title="Subscriber emails are never shared. Only aggregated counts are shown.">
            <InfoIcon size={16} />
          </PrivacyHint>
        </HeaderActions>
      </PageLayout.Header>
      <PageLayout.Content>
        {!hasData ? (
          <EmptyState>
            <EmptyIcon>
              <MailIcon size={48} />
            </EmptyIcon>
            <EmptyText>No subscribers yet</EmptyText>
            <EmptySubtext>
              Subscribers will appear here when visitors sign up for game
              updates.
            </EmptySubtext>
          </EmptyState>
        ) : (
          <ContentGrid>
            {/* Overview Cards */}
            <SummaryGrid>
              <SummaryCard>
                <SummaryCardIcon>
                  <UsersIcon size={20} />
                </SummaryCardIcon>
                <SummaryValue>
                  {(s?.total_subscribers || 0).toLocaleString()}
                </SummaryValue>
                <SummaryLabel>Total Subscribers</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryCardIcon>
                  <TrendingUpIcon size={20} />
                </SummaryCardIcon>
                <SummaryValue>
                  {(s?.subscribers_gained || 0).toLocaleString()}
                </SummaryValue>
                <SummaryLabel>Subscribers Gained</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryCardIcon>
                  <TrendingDownIcon size={20} />
                </SummaryCardIcon>
                <SummaryValue>
                  {(s?.unsubscribes || 0).toLocaleString()}
                </SummaryValue>
                <SummaryLabel>Unsubscribes</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryCardIcon>
                  <TrendingUpIcon size={20} />
                </SummaryCardIcon>
                <NetValue $positive={(s?.net_growth || 0) >= 0}>
                  {(s?.net_growth || 0) >= 0 ? '+' : ''}
                  {(s?.net_growth || 0).toLocaleString()}
                </NetValue>
                <SummaryLabel>Net Growth</SummaryLabel>
              </SummaryCard>
              {topGame && topGame.subscribers_gained > 0 && (
                <SummaryCard>
                  <SummaryCardIcon>
                    <UsersIcon size={20} />
                  </SummaryCardIcon>
                  <TopGameValue>{topGame.game_title}</TopGameValue>
                  <SummaryLabel>
                    Top Game ({topGame.subscribers_gained} gained)
                  </SummaryLabel>
                </SummaryCard>
              )}
              <SummaryCard>
                <SummaryCardIcon>
                  <MailIcon size={20} />
                </SummaryCardIcon>
                <SummaryValue>{confirmRate}%</SummaryValue>
                <SummaryLabel>Confirm Rate</SummaryLabel>
              </SummaryCard>
            </SummaryGrid>

            {/* Growth Trends Chart */}
            {ts && ts.length > 0 && (
              <Section>
                <SectionHeader>
                  <SectionTitle>Growth Trends</SectionTitle>
                  <ChartToggle>
                    {(
                      [
                        ['subscribers_gained', 'Gained'],
                        ['unsubscribes', 'Unsubscribes'],
                        ['net_growth', 'Net Growth'],
                      ] as const
                    ).map(([key, label]) => (
                      <Button
                        key={key}
                        variant="nav"
                        size="sm"
                        className={chartMetric === key ? 'active' : ''}
                        onClick={() => setChartMetric(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </ChartToggle>
                </SectionHeader>
                <ChartContainer>
                  <AudienceLineChart data={ts} metric={chartMetric} />
                </ChartContainer>
              </Section>
            )}

            {/* By Game Table */}
            {gamesData && gamesData.length > 0 && (
              <Section>
                <SectionTitle>By Game</SectionTitle>
                <GamesTable>
                  <thead>
                    <tr>
                      <Th $align="left">Game</Th>
                      <Th $align="right">Subscribers</Th>
                      <Th $align="right">Gained</Th>
                      <Th $align="right">Unsubs</Th>
                      <Th $align="right">Net</Th>
                      <Th $align="right">Trend</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {gamesData.map((game) => {
                      const trend =
                        game.total_subscribers > 0
                          ? (
                              (game.net_growth / game.total_subscribers) *
                              100
                            ).toFixed(1)
                          : '0';
                      const trendPositive = Number.parseFloat(trend) >= 0;
                      return (
                        <ClickableRow
                          key={game.game_id}
                          onClick={() => setSelectedGameId(game.game_id)}
                        >
                          <Td $align="left">
                            <GameInfo>
                              {game.cover_url && (
                                <GameCover src={game.cover_url} alt="" />
                              )}
                              <GameTitle>{game.game_title}</GameTitle>
                            </GameInfo>
                          </Td>
                          <Td $align="right">
                            {game.total_subscribers.toLocaleString()}
                          </Td>
                          <Td $align="right">
                            {game.subscribers_gained.toLocaleString()}
                          </Td>
                          <Td $align="right">
                            {game.unsubscribes.toLocaleString()}
                          </Td>
                          <TdNet $align="right" $positive={game.net_growth >= 0}>
                            {game.net_growth >= 0 ? '+' : ''}
                            {game.net_growth.toLocaleString()}
                          </TdNet>
                          <TdNet $align="right" $positive={trendPositive}>
                            {trendPositive ? '+' : ''}
                            {trend}%
                          </TdNet>
                        </ClickableRow>
                      );
                    })}
                  </tbody>
                </GamesTable>
              </Section>
            )}
          </ContentGrid>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
}

// --- Line Chart ---

function AudienceLineChart({
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

  const values = entries.map(([, v]) => v);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const height = 160;
  const padY = 16;
  const usableH = height - padY * 2;

  const points = entries.map(([, val], i) => {
    const x = (i / Math.max(entries.length - 1, 1)) * 100;
    const y = padY + usableH - ((val - min) / range) * usableH;
    return {x, y};
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <ChartSvg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="audienceAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--color-primary-500)"
            stopOpacity="0.2"
          />
          <stop
            offset="100%"
            stopColor="var(--color-primary-500)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#audienceAreaGrad)" />
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

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const GameFilterContainer = styled.div`
  min-width: 12rem;
`;

const DateRangeSelector = styled.div`
  display: flex;
  gap: var(--spacing-1);
`;

const PrivacyHint = styled.div`
  color: var(--fg-subtle);
  cursor: help;
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

const SummaryCardIcon = styled.div`
  color: var(--fg-subtle);
  margin-bottom: var(--spacing-1);
`;

const SummaryValue = styled.span`
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--fg);
`;

const NetValue = styled.span<{$positive: boolean}>`
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: ${({$positive}) =>
    $positive ? 'var(--color-green-500, #22c55e)' : 'var(--color-red-500, #ef4444)'};
`;

const TopGameValue = styled.span`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

// Table

const GamesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th<{$align: 'left' | 'right'}>`
  text-align: ${(p) => p.$align};
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--fg-subtle);
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--border-muted);
`;

const Td = styled.td<{$align: 'left' | 'right'}>`
  text-align: ${(p) => p.$align};
  font-size: var(--text-sm);
  color: var(--fg);
  padding: var(--spacing-2) var(--spacing-3);
  font-variant-numeric: tabular-nums;
`;

const TdNet = styled.td<{$align: 'left' | 'right'; $positive: boolean}>`
  text-align: ${(p) => p.$align};
  font-size: var(--text-sm);
  padding: var(--spacing-2) var(--spacing-3);
  font-variant-numeric: tabular-nums;
  color: ${({$positive}) =>
    $positive ? 'var(--color-green-600, #16a34a)' : 'var(--color-red-600, #dc2626)'};
`;

const ClickableRow = styled.tr`
  cursor: pointer;
  &:hover {
    background: var(--bg-hover);
  }
`;

const GameInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const GameCover = styled.img`
  width: 2rem;
  height: 2rem;
  object-fit: cover;
  border-radius: var(--radius-sm);
`;

const GameTitle = styled.span`
  font-weight: var(--font-weight-medium);
`;

// Empty state

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-16) var(--spacing-6);
  background: var(--bg-surface);
  border: 1px dashed var(--border-muted);
  border-radius: var(--radius-xl);
`;

const EmptyIcon = styled.div`
  color: var(--fg-subtle);
  margin-bottom: var(--spacing-4);
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
  max-width: 28rem;
`;
