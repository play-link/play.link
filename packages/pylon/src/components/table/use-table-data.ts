import {useCallback, useMemo, useState} from 'react';
import {applySearch} from './search';
import {sortData} from './sorting';
import type {TableColumn} from './types';

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [50, 100, 200];
const INFINITE_SCROLL_INCREMENT = 50;

export interface UseTableDataOptions<T extends Record<string, any>> {
  data: T[];
  columns: TableColumn<T>[];
  /** Initial sort key (prefix with - for descending) */
  sortBy?: string;
  /** Search query string */
  searchQuery?: string;
  /** Keys to search within */
  searchKeys?: string[];
  /** Enable pagination */
  pagination?: boolean;
  /** Initial rows per page */
  paginationRowsPerPage?: number;
  /** Options for rows per page dropdown */
  paginationRowsPerPageOptions?: number[];
  /** Enable infinite scroll mode */
  infiniteScroll?: boolean;
}

export interface UseTableDataResult<T> {
  /** Current page data after filtering, sorting, and pagination */
  currentPageData: T[];
  /** Total filtered data count (before pagination) */
  filteredCount: number;
  /** Current sort key */
  sortBy: string;
  /** Update sort key */
  setSortBy: (sortBy: string) => void;
  /** Current row start index */
  rowStart: number;
  /** Update row start index */
  setRowStart: (rowStart: number) => void;
  /** Current rows per page */
  rowsPerPage: number;
  /** Update rows per page */
  setRowsPerPage: (rowsPerPage: number) => void;
  /** Rows per page options */
  rowsPerPageOptions: number[];
  /** Whether there's data to display */
  isEmpty: boolean;
  /** Load more items (for infinite scroll) */
  loadMore: () => void;
}

export function useTableData<T extends Record<string, any>>({
  data,
  columns,
  sortBy: initialSortBy = '',
  searchQuery = '',
  searchKeys = [],
  pagination = true,
  paginationRowsPerPage = 50,
  paginationRowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
  infiniteScroll = false,
}: UseTableDataOptions<T>): UseTableDataResult<T> {
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [rowsPerPage, setRowsPerPage] = useState(
    infiniteScroll ? INFINITE_SCROLL_INCREMENT : pagination ? paginationRowsPerPage : Infinity,
  );
  const [rowStart, setRowStart] = useState(0);

  // Apply search then sort
  const filteredData = useMemo(() => {
    const searched = applySearch({data, query: searchQuery, searchKeys});
    return sortData({data: searched, sortBy, columns});
  }, [data, searchQuery, searchKeys, sortBy, columns]);

  // Apply pagination/infinite scroll limiting
  const currentPageData = useMemo(() => {
    if (infiniteScroll) {
      // For infinite scroll, always start from 0 and show up to rowsPerPage
      return filteredData.slice(0, rowsPerPage);
    }
    return filteredData.slice(rowStart, rowStart + rowsPerPage);
  }, [filteredData, rowStart, rowsPerPage, infiniteScroll]);

  // Load more items for infinite scroll
  const loadMore = useCallback(() => {
    if (infiniteScroll) {
      setRowsPerPage((prev) => Math.min(prev + INFINITE_SCROLL_INCREMENT, filteredData.length));
    }
  }, [infiniteScroll, filteredData.length]);

  return {
    currentPageData,
    filteredCount: filteredData.length,
    sortBy,
    setSortBy,
    rowStart,
    setRowStart,
    rowsPerPage,
    setRowsPerPage,
    rowsPerPageOptions: paginationRowsPerPageOptions,
    isEmpty: currentPageData.length === 0,
    loadMore,
  };
}
