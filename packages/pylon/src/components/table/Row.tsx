import styled, {css} from 'styled-components';
import {TableRowCell} from './RowCell';
import type {TableProps} from './types';

type Props = Pick<
  TableProps,
  'columns' | 'onClickRow' | 'propertyForKey' | 'rowCssFn' | 'onContextMenuRow'
> & {
  d: {[key: string]: any};
  isContextMenuActive?: boolean;
};

export function TableRow({
  columns,
  d,
  onClickRow,
  propertyForKey,
  rowCssFn,
  onContextMenuRow,
  isContextMenuActive,
}: Props) {
  const onClick = (evt: any) => {
    const selection = typeof window !== 'undefined' ? window.getSelection?.() : null;
    const hasSelectedText =
      !!selection && selection.type === 'Range' && selection.toString().trim().length > 0;
    if (hasSelectedText) return;
    onClickRow?.(d, evt);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    if (onContextMenuRow) {
      event.preventDefault();
      onContextMenuRow(d, event);
    }
  };

  return (
    <Row
      onClick={(e) => onClick?.(e)}
      $clickable={!!onClickRow}
      $rowData={d}
      $rowCssFn={rowCssFn}
      $isContextMenuActive={isContextMenuActive}
      onContextMenu={handleContextMenu}
    >
      {columns.map((c, idx) => (
        <TableRowCell key={`cell:${c.accessor}:${d[propertyForKey!] || idx}`} column={c} d={d} />
      ))}
    </Row>
  );
}

const Row = styled.tr<{
  $clickable: boolean;
  $rowData: Record<string, any>;
  $rowCssFn?: TableProps['rowCssFn'];
  $isContextMenuActive?: boolean;
}>`
  border-bottom: 0.0625rem solid var(--border-soft);

  &:last-child {
    border-bottom: none;
  }

  ${(p) =>
    p.$clickable &&
    css`
      cursor: pointer;
      &:hover {
        background: var(--bg-soft);
        td:first-child {
          background: var(--bg-soft);
        }
      }
    `}

  ${(p) =>
    p.$isContextMenuActive &&
    css`
      background: var(--bg-soft);
      td {
        background: var(--bg-soft);
      }
    `}

  ${(p) => p.$rowCssFn?.({d: p.$rowData})}
`;
