import {TableRow} from './Row';
import type {TableProps} from './types';

type Props = Pick<
  TableProps,
  'columns' | 'onClickRow' | 'propertyForKey' | 'rowCssFn' | 'onContextMenuRow'
> & {
  currentPageData: {[key: string]: any}[];
  contextMenuActiveRowKey?: string | number;
};

export function TableBody({
  columns,
  currentPageData,
  onClickRow,
  onContextMenuRow,
  propertyForKey,
  rowCssFn,
  contextMenuActiveRowKey,
}: Props) {
  return (
    <tbody>
      {currentPageData.map((d, idx) => {
        const rowKey = d[propertyForKey!] || idx;
        return (
          <TableRow
            key={`row:${rowKey}`}
            d={d}
            columns={columns}
            onClickRow={onClickRow}
            onContextMenuRow={onContextMenuRow}
            propertyForKey={propertyForKey}
            rowCssFn={rowCssFn}
            isContextMenuActive={contextMenuActiveRowKey === rowKey}
          />
        );
      })}
    </tbody>
  );
}
