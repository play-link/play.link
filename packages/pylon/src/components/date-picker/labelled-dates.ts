import type {DateTime} from 'luxon';

export type LabelledDatesOption =
  | 'last-month'
  | 'last-week'
  | 'today'
  | 'yesterday'
  | 'tomorrow'
  | 'next-7-days'
  | 'last-7-days'
  | 'last-30-days'
  | 'this-week'
  | 'next-week'
  | 'this-month'
  | 'next-month'
  | 'this-year';

/**
 * Calculate start of week with customizable first day of week.
 * Luxon's default startOf('week') uses Monday, so we calculate manually.
 * @param date - The DateTime to calculate from
 * @param weekStartsOn - Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function startOfWeekCustom(date: DateTime, weekStartsOn: number): DateTime {
  const dayOfWeek = date.weekday; // Luxon: 1 = Monday, 7 = Sunday
  // Convert Luxon weekday (1-7, Monday-Sunday) to 0-based Sunday-first (0-6, Sunday-Saturday)
  const dayFromSunday = dayOfWeek === 7 ? 0 : dayOfWeek;
  // Calculate days to subtract to get to the start of week
  const daysToSubtract = (dayFromSunday - weekStartsOn + 7) % 7;
  return date.minus({days: daysToSubtract}).startOf('day');
}

/**
 * Calculate end of week with customizable first day of week.
 * End of week is 6 days after the start of week.
 * @param date - The DateTime to calculate from
 * @param weekStartsOn - Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function endOfWeekCustom(date: DateTime, weekStartsOn: number): DateTime {
  const start = startOfWeekCustom(date, weekStartsOn);
  return start.plus({days: 6}).endOf('day');
}

export function getLabelledDatesOptions(now: DateTime, weekStartsOn: number) {
  return [
    {
      from: now,
      to: now,
      label: 'Today',
      key: 'today' as const,
    },
    {
      from: now.plus({days: 1}),
      to: now.plus({days: 1}),
      label: 'Tomorrow',
      key: 'tomorrow' as const,
    },
    {
      from: now.minus({days: 1}),
      to: now.minus({days: 1}),
      label: 'Yesterday',
      key: 'yesterday' as const,
    },
    {
      from: now,
      to: now.plus({days: 6}),
      label: 'Next 7 days',
      key: 'next-7-days' as const,
    },
    {
      from: now.minus({days: 7}),
      to: now.minus({days: 1}),
      label: 'Last 7 days',
      key: 'last-7-days' as const,
    },
    {
      from: startOfWeekCustom(now, weekStartsOn),
      to: endOfWeekCustom(now, weekStartsOn),
      label: 'This week',
      key: 'this-week' as const,
    },
    {
      from: startOfWeekCustom(now.plus({weeks: 1}), weekStartsOn),
      to: endOfWeekCustom(now.plus({weeks: 1}), weekStartsOn),
      label: 'Next week',
      key: 'next-week' as const,
    },
    {
      from: startOfWeekCustom(now.minus({weeks: 1}), weekStartsOn),
      to: endOfWeekCustom(now.minus({weeks: 1}), weekStartsOn),
      label: 'Last week',
      key: 'last-week' as const,
    },
    {
      from: now.startOf('month'),
      to: now.endOf('month'),
      label: 'This month',
      key: 'this-month' as const,
    },
    {
      from: now.plus({months: 1}).startOf('month'),
      to: now.plus({months: 1}).endOf('month'),
      label: 'Next month',
      key: 'next-month' as const,
    },
    {
      from: now.minus({months: 1}).startOf('month'),
      to: now.minus({months: 1}).endOf('month'),
      label: 'Last month',
      key: 'last-month' as const,
    },
    {
      from: now.minus({days: 29}),
      to: now.minus({days: 1}),
      label: 'Last 30 days',
      key: 'last-30-days' as const,
    },
    {
      from: now.startOf('year'),
      to: now.endOf('year'),
      label: 'This year',
      key: 'this-year' as const,
    },
  ];
}
