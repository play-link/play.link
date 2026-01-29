import type {RuleSet} from 'styled-components';
import styled, {css} from 'styled-components';
import {TableHeaderCell} from './HeaderCell';
import type {TableColumn, TableProps} from './types';

interface Props {
  columns?: TableColumn[];
  onUpdateSortBy: (sortBy: string) => void;
  sortBy: string;
  headCss?: TableProps['headCss'];
  stickyHeader?: boolean;
  stickyHeaderOffset?: number;
}

export function TableHeader({
  columns,
  onUpdateSortBy,
  headCss,
  sortBy,
  stickyHeader,
  stickyHeaderOffset = 0,
}: Props) {
  return (
    <THead $headCss={headCss} $sticky={stickyHeader} $offset={stickyHeaderOffset}>
      <tr>
        {columns?.map((column, idx) => (
          <TableHeaderCell
            key={column.accessor || idx}
            index={idx}
            column={column}
            sortBy={sortBy}
            onUpdateSortBy={onUpdateSortBy}
          />
        ))}
      </tr>
    </THead>
  );
}

const THead = styled.thead<{
  $headCss?: RuleSet<object>;
  $sticky?: boolean;
  $offset?: number;
}>`
  ${({$sticky, $offset}) =>
    $sticky &&
    css`
      position: sticky;
      top: ${$offset}px;
      z-index: 90;
      background: var(--bg);

      /* Borders on thead level so they stay visible when sticky */
      &::before,
      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--border-muted);
      }

      &::before {
        top: 0;
      }

      &::after {
        bottom: 0;
      }
    `}

  ${({$headCss}) => $headCss}
`;
