import {ArrowUpIcon} from 'lucide-react';
import {styled} from 'styled-components';
import {toClassName} from '../../style';
import {getSortDirection, getSortKey} from './sorting';
import type {TableColumn} from './types';

interface Props {
  column: TableColumn;
  index: number;
  onUpdateSortBy: (sortBy: string) => void;
  sortBy: string;
}

export function TableHeaderCell({column: c, index, onUpdateSortBy, sortBy}: Props) {
  const {isSorting, isSortable, direction} = sort(c, sortBy);
  const rightAlignment = c.type === 'number' || c.alignRight || false;

  const onClick = () => {
    if (!isSortable) return;
    const newSortBy = !isSorting || direction > 0 ? `-${c.accessor!}` : c.accessor!;
    onUpdateSortBy?.(newSortBy);
  };

  return (
    <Th
      onClick={onClick}
      className={toClassName({
        'right-alignment': rightAlignment,
        'no-wrap': !!c.noWrap,
      })}
      style={{
        minWidth: c.width,
      }}
    >
      <HeaderTitle
        className={toClassName({
          sortable: isSortable,
          'first-child': index === 0,
        })}
      >
        {c.title}
        {isSorting && <StyledArrowIcon size={12} $direction={direction} />}
      </HeaderTitle>
    </Th>
  );
}

const Th = styled.th`
  background: var(--bg-minimal);
  border-bottom: 0.0625rem solid var(--border-soft);
  border-top: 0.0625rem solid var(--border-soft);
  padding-bottom: 0.0625rem;
  user-select: none;

  &.right-alignment {
    text-align: right;
  }

  &.no-wrap {
    white-space: nowrap;
  }

  &:first-of-type > div {
    padding-left: var(--table-bleed, var(--spacing-4));
  }

  &:last-of-type > div {
    padding-right: var(--table-bleed, var(--spacing-4));
  }
`;

const HeaderTitle = styled.div`
  align-items: center;
  display: inline-flex;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  gap: var(--spacing-1);
  color: var(--fg-subtle);
  padding: var(--spacing-2) var(--spacing-4);
  white-space: nowrap;

  &.sortable {
    cursor: var(--button-cursor, pointer);

    &:hover {
      color: var(--fg-body);
    }
  }
`;

const StyledArrowIcon = styled(ArrowUpIcon)<{
  $direction: number;
}>`
  color: inherit;
  display: flex;
  transform: ${(p) => (p.$direction <= 0 ? 'rotate(180deg)' : 'unset')};
  transition: transform 0.2s linear;
`;

function sort(c: TableColumn, sortBy: string) {
  const isSortable = !!c.accessor && !!c.title && !c.noSortable && !!c.type;
  let isSorting = false;
  let direction = 0;

  if (isSortable) {
    isSorting = getSortKey(sortBy) === c.accessor;
    direction = isSorting ? getSortDirection(sortBy) : 0;
  }

  return {isSorting, direction, isSortable};
}
