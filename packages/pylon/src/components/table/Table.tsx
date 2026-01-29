import {useRef} from 'react';
import type {RuleSet} from 'styled-components';
import styled, {css} from 'styled-components';
import {dropdownOverlayCss} from '../../style';
import {Overlay} from '../overlay';
import {TableBody} from './Body';
import {TableHeader} from './Header';
import {TablePagination} from './Pagination';
import type {TableProps} from './types';
import {useContextMenu} from './use-context-menu';
import {useInfiniteScroll} from './use-infinite-scroll';
import {useTableData} from './use-table-data';

export function Table({
  bleed,
  columns,
  contextMenuContent,
  data,
  emptyMessage = '',
  headCss,
  infiniteScroll = false,
  noHeader = false,
  onClickRow,
  onContextMenuRow,
  pagination = true,
  paginationRowsPerPage = 50,
  paginationRowsPerPageOptions,
  propertyForKey = 'id',
  rowCssFn,
  searchKeys,
  searchQuery,
  sortBy: initialSortBy,
  stickyFirstColumn = false,
  stickyHeader = false,
  stickyHeaderOffset = 0,
  stickyLastColumn = false,
  tableCss,
  ...props
}: TableProps) {
  // Table data management (sorting, filtering, pagination)
  const {
    currentPageData,
    filteredCount,
    sortBy,
    setSortBy,
    rowStart,
    setRowStart,
    rowsPerPage,
    setRowsPerPage,
    rowsPerPageOptions,
    isEmpty,
    loadMore,
  } = useTableData({
    data,
    columns,
    sortBy: initialSortBy,
    searchQuery,
    searchKeys,
    pagination: !infiniteScroll && pagination,
    paginationRowsPerPage,
    paginationRowsPerPageOptions,
    infiniteScroll,
  });

  // Scroll container ref for infinite scroll IntersectionObserver
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll hook
  const {sentinelRef, hasMore} = useInfiniteScroll({
    enabled: infiniteScroll,
    visibleCount: currentPageData.length,
    totalCount: filteredCount,
    onLoadMore: loadMore,
    scrollContainerRef: infiniteScroll ? scrollContainerRef : undefined,
  });

  // Context menu hook
  const {
    contextMenuOpened,
    setContextMenuOpened,
    contextMenuRowKey,
    contextMenuEvent,
    handleContextMenu,
    handleCloseContextMenu,
    contextMenuRowData,
  } = useContextMenu({
    contextMenuContent,
    onContextMenuRow,
    propertyForKey,
    currentPageData,
  });

  const showPagination = pagination && !infiniteScroll;

  return (
    <TableRoot
      ref={infiniteScroll ? scrollContainerRef : undefined}
      $bleed={bleed}
      $scrollable={infiniteScroll}
      {...props}
    >
      <TableContent>
        <StyledTable
          $extraCss={tableCss}
          $stickyFirstColumn={stickyFirstColumn}
          $stickyLastColumn={stickyLastColumn}
        >
          {!noHeader && (
            <TableHeader
              columns={columns}
              onUpdateSortBy={setSortBy}
              sortBy={sortBy}
              headCss={headCss}
              stickyHeader={stickyHeader}
              stickyHeaderOffset={stickyHeaderOffset}
            />
          )}
          <TableBody
            propertyForKey={propertyForKey}
            columns={columns}
            currentPageData={currentPageData}
            onClickRow={onClickRow}
            onContextMenuRow={contextMenuContent ? handleContextMenu : onContextMenuRow}
            contextMenuActiveRowKey={contextMenuOpened ? contextMenuRowKey : undefined}
            rowCssFn={rowCssFn}
          />
        </StyledTable>

        {infiniteScroll && hasMore && (
          <LoadMoreIndicator ref={sentinelRef}>
            <span className="fg-muted">Loading more...</span>
          </LoadMoreIndicator>
        )}
      </TableContent>

      {isEmpty && emptyMessage && <EmptyMessage>{emptyMessage}</EmptyMessage>}

      {showPagination && (
        <TablePagination
          count={filteredCount}
          paginationRowsPerPage={paginationRowsPerPage}
          paginationRowsPerPageOptions={rowsPerPageOptions}
          rowsPerPage={rowsPerPage}
          rowStart={rowStart}
          onRowStartChange={setRowStart}
          onRowsPerPageChange={setRowsPerPage}
        />
      )}

      {contextMenuContent && contextMenuRowData && (
        <Overlay
          opened={contextMenuOpened}
          setOpened={setContextMenuOpened}
          modalCss={dropdownOverlayCss}
          cancelOnEscKey
          cancelOnOutsideClick
          withBackdrop
          transparentBackdrop
          position={{
            positionEvent: contextMenuEvent,
            fitToScreen: true,
            verticalOffset: -10,
          }}
        >
          {contextMenuContent(contextMenuRowData, handleCloseContextMenu)}
        </Overlay>
      )}
    </TableRoot>
  );
}

// --- Styled Components ---

/**
 * Root container for the table.
 * - Handles bleed (negative margin to ignore parent padding)
 * - Handles scrollable mode for infinite scroll
 */
const TableRoot = styled.div<{
  $bleed?: TableProps['bleed'];
  $scrollable?: boolean;
}>`
  color: var(--fg);
  display: flex;
  flex-direction: column;
  height: 100%;

  /* Bleed: expand table to ignore parent's horizontal padding */
  ${({$bleed}) =>
    typeof $bleed === 'number' &&
    css`
      --table-bleed: var(--spacing-${$bleed});
      margin-left: calc(var(--table-bleed) * -1);
      margin-right: calc(var(--table-bleed) * -1);
    `}

  /* Scrollable: enable overflow for infinite scroll */
  ${({$scrollable}) =>
    $scrollable &&
    css`
      overflow: auto;
    `}
`;

/** Container for table content (native table + loading indicator) */
const TableContent = styled.div`
  min-height: 0;
`;

/** Native HTML table with base styles and sticky column support */
const StyledTable = styled.table<{
  $extraCss?: RuleSet<object>;
  $stickyFirstColumn?: boolean;
  $stickyLastColumn?: boolean;
}>`
  border-collapse: collapse;
  border-spacing: 0;
  margin: 0;
  text-align: left;
  width: 100%;

  ${(p) => p.$extraCss}

  /* Sticky first column for horizontal scrolling */
  ${(p) =>
    p.$stickyFirstColumn &&
    css`
      /* Create stacking context for all cells */
      th,
      td {
        position: relative;
        z-index: 0;
      }

      /* First column: sticky + on top of other cells */
      th:first-child,
      td:first-child {
        position: sticky;
        left: 0;
        z-index: 80;
        box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.1);
      }

      /* Header first cell uses header background color */
      th:first-child {
        background: var(--bg);
      }

      /* Body first cell uses body background color */
      td:first-child {
        background: var(--bg);
      }

      /* Header first cell (corner): highest z-index */
      thead th:first-child {
        z-index: 100;
      }
    `}

  /* Sticky last column for horizontal scrolling */
  ${(p) =>
    p.$stickyLastColumn &&
    css`
      /* Create stacking context for all cells */
      th,
      td {
        position: relative;
        z-index: 0;
      }

      /* Last column: sticky + on top of other cells */
      th:last-child,
      td:last-child {
        position: sticky;
        right: 0;
        z-index: 80;
        box-shadow: -2px 0 4px -2px rgba(0, 0, 0, 0.1);
      }

      /* Header last cell uses header background color */
      th:last-child {
        background: var(--bg);
      }

      /* Body last cell uses body background color */
      td:last-child {
        background: var(--bg);
      }

      /* Header last cell (corner): highest z-index */
      thead th:last-child {
        z-index: 100;
      }
    `}
`;

/** Sentinel element for infinite scroll IntersectionObserver */
const LoadMoreIndicator = styled.div`
  display: flex;
  justify-content: center;
  padding: var(--spacing-4);
`;

/** Empty state message */
const EmptyMessage = styled.div`
  padding: var(--spacing-6) var(--spacing-4);
  text-align: center;
  color: var(--fg-subtle);
`;
