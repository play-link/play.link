import {
  EyeIcon,
  MousePointerClickIcon,
  PercentIcon,
  UsersIcon,
} from 'lucide-react';
import {Button, Card} from '@play/pylon';
import {
  CardHeader,
  CardHeaderRight,
  CardSubtitle,
  CardTitle,
  StatIcon,
  StatItem,
  StatLabel,
  StatsGrid,
  StatValue,
} from './styles';
import type {OverviewStats} from './types';

interface OverviewStatsCardProps {
  stats: OverviewStats;
  onOpenAnalytics: () => void;
}

export function OverviewStatsCard({stats, onOpenAnalytics}: OverviewStatsCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader>
        <CardTitle>Quick stats</CardTitle>
        <CardHeaderRight>
          <CardSubtitle>Last 30 days</CardSubtitle>
          <Button
            variant="ghost"
            size="xs"
            autoHeight
            onClick={onOpenAnalytics}
          >
            Open analytics →
          </Button>
        </CardHeaderRight>
      </CardHeader>
      <StatsGrid>
        <StatItem>
          <StatIcon>
            <EyeIcon size={18} />
          </StatIcon>
          <StatValue>{stats.pageViews.toLocaleString()}</StatValue>
          <StatLabel>Visits</StatLabel>
        </StatItem>
        <StatItem>
          <StatIcon>
            <MousePointerClickIcon size={18} />
          </StatIcon>
          <StatValue>{stats.linkClicks.toLocaleString()}</StatValue>
          <StatLabel>Clicks</StatLabel>
        </StatItem>
        <StatItem>
          <StatIcon>
            <PercentIcon size={18} />
          </StatIcon>
          <StatValue>{stats.ctr}%</StatValue>
          <StatLabel>CTR</StatLabel>
        </StatItem>
        <StatItem>
          <StatIcon>
            <UsersIcon size={18} />
          </StatIcon>
          <StatValue>{stats.subscribers.toLocaleString()}</StatValue>
          <StatLabel>Subscribers</StatLabel>
        </StatItem>
      </StatsGrid>
    </Card>
  );
}
