import type {GameOutletContext} from '@/pages/GamePage';
import type {PageCompleteness} from './types';

export const STATUS_LABELS: Record<string, string> = {
  IN_DEVELOPMENT: 'In Development',
  UPCOMING: 'Upcoming',
  EARLY_ACCESS: 'Early Access',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
};

export function computePageCompleteness(game: GameOutletContext): PageCompleteness {
  const checks = [
    {label: 'Title', done: !!game.title},
    {label: 'Summary', done: !!game.summary},
    {label: 'About the game', done: !!game.about_the_game},
    {label: 'Cover image', done: !!game.cover_url},
    {label: 'Header image', done: !!game.header_url},
    {label: 'Trailer', done: !!game.trailer_url},
    {
      label: 'Genres',
      done: Array.isArray(game.genres) && game.genres.length > 0,
    },
    {
      label: 'Platforms',
      done: Array.isArray(game.platforms) && game.platforms.length > 0,
    },
  ];

  const completed = checks.filter((check) => check.done);
  const missing = checks.filter((check) => !check.done);
  const percentage = Math.round((completed.length / checks.length) * 100);

  return {percentage, missing, completed};
}
