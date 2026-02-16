import type {GameOutletContext} from '@/pages/GamePage';

export interface SummaryRow {
  event_type: string;
  total: number;
  unique_visitors: number;
}

export interface CompletenessCheck {
  label: string;
  done: boolean;
}

export interface PageCompleteness {
  percentage: number;
  missing: CompletenessCheck[];
  completed: CompletenessCheck[];
}

export interface LatestGameUpdate {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export interface OverviewStats {
  pageViews: number;
  linkClicks: number;
  ctr: string;
  subscribers: number;
}

export interface OverviewViewModel {
  game: GameOutletContext;
  isPublished: boolean;
  gameUrl: string;
  playLinkBase: string;
}
