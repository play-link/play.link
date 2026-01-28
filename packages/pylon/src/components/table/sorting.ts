import {DateTime} from 'luxon';
import type {TableColumn, TableProps} from './types';

export type SortDirectionNum = -1 | 1;

export function getSortDirection(sortBy: string): SortDirectionNum {
  return sortBy.startsWith('-') ? -1 : 1;
}

export function getSortKey(sortBy: string): string {
  return sortBy ? sortBy.replace(/^-/, '') : '';
}

export function sortStringFn(direction: SortDirectionNum, a: string, b: string): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b) * direction;
  }
  return 0;
}

export function sortNumberFn(direction: SortDirectionNum, a: number, b: number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * direction;
  }
  return a;
}

export function sortDateFn(
  direction: SortDirectionNum,
  a: string | DateTime,
  b: string | DateTime,
): number {
  const dateA = DateTime.isDateTime(a)
    ? a
    : DateTime.fromISO(a as string) || DateTime.invalid('Invalid date A');
  const dateB = DateTime.isDateTime(b)
    ? b
    : DateTime.fromISO(b as string) || DateTime.invalid('Invalid date B');

  if (!dateA.isValid && !dateB.isValid) return 0;
  if (!dateA.isValid) return direction;
  if (!dateB.isValid) return -direction;

  return (dateA.toMillis() - dateB.toMillis()) * direction;
}

export function sortBooleanFn(direction: SortDirectionNum, a: boolean, b: boolean): number {
  return a === b ? 0 : a ? -1 * direction : direction;
}

export function getSortFunction(
  c: TableColumn,
  direction: SortDirectionNum,
): (_a: any, _b: any) => number {
  // Helper to get value - uses getSortValue if defined, otherwise accessor
  const getValue = (row: any) => {
    if (c.getSortValue) {
      return c.getSortValue(row);
    }
    return row[c.accessor!];
  };

  switch (c.type) {
    case 'number':
      return (a, b) => sortNumberFn(direction, getValue(a), getValue(b));
    case 'date':
      return (a, b) => sortDateFn(direction, getValue(a), getValue(b));
    case 'boolean':
      return (a, b) => sortBooleanFn(direction, getValue(a), getValue(b));
    case 'string':
      return (a, b) => sortStringFn(direction, getValue(a), getValue(b));
    default:
      console.warn('Unknown column type', c.type);
      return () => 0;
  }
}

type SortDataParams = (_props: Pick<TableProps, 'columns' | 'data' | 'sortBy'>) => any[];

export const sortData: SortDataParams = ({columns, data, sortBy}) => {
  const sortKey = getSortKey(sortBy!);
  const column = sortKey ? columns.find((col) => col.accessor === sortKey) : null;

  if (column && column.accessor) {
    const direction = getSortDirection(sortBy!);
    return data.sort(getSortFunction(column, direction));
  }

  return data;
};
