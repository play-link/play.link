import {
  BarChart3Icon,
  EyeIcon,
  GlobeIcon,
  LinkIcon,
  MonitorIcon,
  MousePointerClickIcon,
  SmartphoneIcon,
  TabletIcon,
  UsersIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button, Loading} from '@play/pylon';
import type {GameOutletContext} from '@/pages/GamePage';
import {trpc} from '@/lib/trpc';

type DateRange = '7' | '30' | '90';

interface SummaryRow {
  event_type: string;
  total: number;
  unique_visitors: number;
}

interface TimeseriesRow {
  day: string;
  event_type: string;
  total: number;
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

interface LinkRow {
  link_id: string;
  label: string;
  url: string;
  total: number;
}

interface DeviceRow {
  device_type: string;
  total: number;
}

export function GameAnalytics() {
  const game = useOutletContext<GameOutletContext>();
  const [days, setDays] = useState<DateRange>('30');

  const queryInput = {gameId: game.id, days};

  const {data: summary, isLoading: summaryLoading} =
    trpc.analytics.summary.useQuery(queryInput);
  const {data: timeseries} =
    trpc.analytics.timeseries.useQuery(queryInput);
  const {data: referrers} = trpc.analytics.topReferrers.useQuery(queryInput);
  const {data: countries} = trpc.analytics.topCountries.useQuery(queryInput);
  const {data: topLinks} = trpc.analytics.topLinks.useQuery(queryInput);
  const {data: devices} = trpc.analytics.devices.useQuery(queryInput);

  const summaryTyped = summary as SummaryRow[] | undefined;
  const timeseriesTyped = timeseries as TimeseriesRow[] | undefined;
  const referrersTyped = referrers as ReferrerRow[] | undefined;
  const countriesTyped = countries as CountryRow[] | undefined;
  const topLinksTyped = topLinks as LinkRow[] | undefined;
  const devicesTyped = devices as DeviceRow[] | undefined;

  const pageViews =
    summaryTyped?.find((s) => s.event_type === 'page_view')?.total || 0;
  const uniqueVisitors =
    summaryTyped?.find((s) => s.event_type === 'page_view')
      ?.unique_visitors || 0;
  const linkClicks =
    summaryTyped?.find((s) => s.event_type === 'link_click')?.total || 0;
  const subscribes =
    summaryTyped?.find((s) => s.event_type === 'subscribe')?.total || 0;

  if (summaryLoading) {
    return (
      <LoadingContainer>
        <Loading size="lg" />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Analytics</Title>
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
      </Header>

      <SummaryGrid>
        <SummaryCard>
          <SummaryIcon>
            <EyeIcon size={20} />
          </SummaryIcon>
          <SummaryValue>{pageViews}</SummaryValue>
          <SummaryLabel>Page Views</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryIcon>
            <UsersIcon size={20} />
          </SummaryIcon>
          <SummaryValue>{uniqueVisitors}</SummaryValue>
          <SummaryLabel>Unique Visitors</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryIcon>
            <MousePointerClickIcon size={20} />
          </SummaryIcon>
          <SummaryValue>{linkClicks}</SummaryValue>
          <SummaryLabel>Link Clicks</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryIcon>
            <BarChart3Icon size={20} />
          </SummaryIcon>
          <SummaryValue>{subscribes}</SummaryValue>
          <SummaryLabel>Subscribers</SummaryLabel>
        </SummaryCard>
      </SummaryGrid>

      {timeseriesTyped && timeseriesTyped.length > 0 && (
        <Section>
          <SectionTitle>Daily Page Views</SectionTitle>
          <BarChartContainer>
            <BarChart data={timeseriesTyped} />
          </BarChartContainer>
        </Section>
      )}

      <ColumnsGrid>
        {referrersTyped && referrersTyped.length > 0 && (
          <Section>
            <SectionTitle>
              <GlobeIcon size={16} /> Top Referrers
            </SectionTitle>
            <RankList>
              {referrersTyped.map((r, i) => (
                <RankItem key={i}>
                  <RankLabel>{r.referrer}</RankLabel>
                  <RankValue>{r.total}</RankValue>
                </RankItem>
              ))}
            </RankList>
          </Section>
        )}

        {countriesTyped && countriesTyped.length > 0 && (
          <Section>
            <SectionTitle>
              <GlobeIcon size={16} /> Top Countries
            </SectionTitle>
            <RankList>
              {countriesTyped.map((c, i) => (
                <RankItem key={i}>
                  <RankLabel>{c.country}</RankLabel>
                  <RankValue>{c.total}</RankValue>
                </RankItem>
              ))}
            </RankList>
          </Section>
        )}

        {topLinksTyped && topLinksTyped.length > 0 && (
          <Section>
            <SectionTitle>
              <LinkIcon size={16} /> Top Links
            </SectionTitle>
            <RankList>
              {topLinksTyped.map((l, i) => (
                <RankItem key={i}>
                  <RankLabel>{l.label}</RankLabel>
                  <RankValue>{l.total}</RankValue>
                </RankItem>
              ))}
            </RankList>
          </Section>
        )}

        {devicesTyped && devicesTyped.length > 0 && (
          <Section>
            <SectionTitle>
              <MonitorIcon size={16} /> Devices
            </SectionTitle>
            <RankList>
              {devicesTyped.map((d, i) => (
                <RankItem key={i}>
                  <RankLabel>
                    <DeviceIcon type={d.device_type} /> {d.device_type}
                  </RankLabel>
                  <RankValue>{d.total}</RankValue>
                </RankItem>
              ))}
            </RankList>
          </Section>
        )}
      </ColumnsGrid>

      {!timeseriesTyped?.length &&
        !referrersTyped?.length &&
        !countriesTyped?.length &&
        pageViews === 0 && (
          <EmptyState>
            <EmptyText>No analytics data yet</EmptyText>
            <EmptySubtext>
              Data will appear here once your game page gets visitors.
            </EmptySubtext>
          </EmptyState>
        )}
    </Container>
  );
}

// --- Simple bar chart ---

function BarChart({
  data,
}: {
  data: {day: string; event_type: string; total: number}[];
}) {
  // Aggregate page_view totals per day
  const dailyMap = new Map<string, number>();
  for (const row of data) {
    if (row.event_type === 'page_view') {
      dailyMap.set(row.day, (dailyMap.get(row.day) || 0) + row.total);
    }
  }

  const entries = Array.from(dailyMap.entries()).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <BarChartGrid>
      {entries.map(([day, total]) => (
        <BarColumn key={day}>
          <BarFill style={{height: `${(total / max) * 100}%`}} />
          <BarLabel>
            {new Date(day).toLocaleDateString('en', {
              month: 'short',
              day: 'numeric',
            })}
          </BarLabel>
        </BarColumn>
      ))}
    </BarChartGrid>
  );
}

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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const DateRangeSelector = styled.div`
  display: flex;
  gap: var(--spacing-1);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
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
