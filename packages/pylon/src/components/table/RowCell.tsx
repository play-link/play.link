import type {RuleSet} from 'styled-components';
import styled from 'styled-components';
import type {TableProps} from './types';

interface Props {
  column: TableProps['columns'][0];
  d: {[key: string]: any};
}

export function TableRowCell({column: c, d}: Props) {
  const rightAlignment = c.alignRight || c.type === 'number';
  const value = c.accessor ? d[c.accessor] : '';

  let content = null;

  if (c.renderContent) {
    content = c.renderContent({d, value});
  } else {
    content = c.formatter ? c.formatter(value) : value;
  }

  return (
    <Cell
      width={c.width}
      $extraCss={c.cellCssFn?.(d) || null}
      $rightAlignment={rightAlignment}
      $noWrap={!!c.noWrap}
    >
      {content}
    </Cell>
  );
}

const Cell = styled.td<{
  $rightAlignment: boolean;
  $extraCss: RuleSet<object> | null;
  $noWrap: boolean;
}>`
  color: inherit;
  padding: var(--spacing-3) var(--spacing-4);
  text-align: ${(p) => (p.$rightAlignment ? 'right' : 'initial')};
  vertical-align: middle;
  white-space: ${(p) => (p.$rightAlignment || p.$noWrap ? 'nowrap' : 'initial')};

  ${(p) => p.$extraCss}

  &:first-child {
    padding-left: var(--table-bleed, var(--spacing-4));
  }

  &:last-child {
    padding-right: var(--table-bleed, var(--spacing-4));
  }
`;
