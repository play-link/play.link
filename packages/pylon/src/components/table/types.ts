import type {ReactNode} from 'react';
import type {RuleSet} from 'styled-components';
import type {Spacing} from '../../style';

type Formatter = (value: any) => ReactNode;

export interface TableColumn<T = any> {
  accessor?: string;
  alignRight?: boolean;
  cellCssFn?: (d?: T) => RuleSet<object> | null;
  formatter?: Formatter;
  noSortable?: boolean;
  noWrap?: boolean;
  renderContent?: (props: {d: T; value: string | number}) => ReactNode;
  /**
   * Custom function to extract the value used for sorting.
   * When provided, this value is used instead of the accessor value.
   * Useful for arrays or complex objects where you want custom sort behavior.
   * @example getSortValue: (d) => d.emails[0] ?? '' // Sort by first email
   * @example getSortValue: (d) => d.items.length // Sort by count
   */
  getSortValue?: (d: T) => string | number | boolean | Date;
  title?: string;
  type?: 'number' | 'string' | 'boolean' | 'date';
  width?: number;
}

export interface TableProps<Data extends Record<string, any> = Record<string, any>> {
  /**
   * If true, the table will have a bleed.
   */
  bleed?: Omit<Spacing, 'auto'>;
  columns: TableColumn[];
  /**
   * The table data. Your data should have a unique identifier (key).
   * The deafult key is id. To override tis value use propertyForKey.
   */
  data: Data[];
  /**
   * Message that will be displayed when the table is empty.
   * @default ''
   */
  emptyMessage?: string | ReactNode;
  /**
   * Rule for the table header
   */
  headCss?: RuleSet<object>;
  /**
   * If true, the table header won't be rendered
   * @default false
   */
  noHeader?: boolean;
  onClickRow?: (d: any, mouseEvent: any) => void;
  onContextMenuRow?: (row: any, event: React.MouseEvent) => void;
  /**
   * Render prop for context menu content. When provided, the Table component
   * will handle opening/closing the context menu overlay and highlighting فعال
   * the row when the menu is open.
   * @param row - The row data
   * @param closeMenu - Function to close the context menu
   */
  contextMenuContent?: (row: any, closeMenu: () => void) => ReactNode;
  sortBy?: string;
  /**
   * Whether the Table will have a pagination.
   * If false all data will be displayed at the same time.
   * @default true
   */
  pagination?: boolean;
  /**
   * Amount of rows that will be rendered by default.
   * @default 50
   */
  paginationRowsPerPage?: number;
  /**
   * Row page dropdown selection options
   * @default [50,100,200]
   */
  paginationRowsPerPageOptions?: number[];
  /**
   * Unique row identifier.
   * @default 'id'
   */
  propertyForKey?: string;
  /**
   * Css getter for every single row.
   */
  rowCssFn?: (row: any) => RuleSet<object> | null;
  /**
   * List of keys that will be used when searching.
   * @default []
   */
  searchKeys?: string[];
  /**
   * Search input value that will be used when searching.
   * @default ''
   */
  searchQuery?: string;
  /**
   * Rule for the table native element.
   */
  tableCss?: RuleSet<object>;
  /**
   * Makes the table header sticky. Uses --table-sticky-offset CSS variable for top position.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * Explicit offset in pixels for sticky header top position.
   * Only used when stickyHeader is true.
   * @default 0
   */
  stickyHeaderOffset?: number;
  /**
   * Makes the first column sticky for horizontal scrolling.
   * Useful for mobile when table is wider than viewport.
   * @default false
   */
  stickyFirstColumn?: boolean;
  /**
   * Makes the last column sticky for horizontal scrolling.
   * Useful for action columns on mobile when table is wider than viewport.
   * @default false
   */
  stickyLastColumn?: boolean;
  /**
   * Enables infinite scroll instead of pagination (useful for mobile).
   * When enabled, pagination UI is hidden and more rows load on scroll.
   * @default false
   */
  infiniteScroll?: boolean;
}
