import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-react';
import {styled} from 'styled-components';
import {Icon} from '../icon';
import {IconButton} from '../icon-button';

interface Props {
  count: number;
  onRowsPerPageChange: (_value: number) => void;
  onRowStartChange: (_value: number) => void;
  paginationRowsPerPage: number;
  paginationRowsPerPageOptions: number[];
  rowsPerPage: number;
  rowStart: number;
}

export function TablePagination({
  count,
  onRowsPerPageChange,
  onRowStartChange,
  paginationRowsPerPage,
  paginationRowsPerPageOptions,
  rowsPerPage,
  rowStart,
}: Props) {
  if (rowsPerPage > count && rowsPerPage === paginationRowsPerPage) {
    return null;
  }

  const rightDisabled = rowStart + rowsPerPage >= count;
  const leftDisabled = rowStart === 0;
  const to = rowStart + rowsPerPage > count ? count : rowStart + rowsPerPage;

  const onArrowClick = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      onRowStartChange(Math.max(0, rowStart - rowsPerPage));
    } else if (direction === 'right') {
      const newRowStart = rowStart + rowsPerPage;
      onRowStartChange(newRowStart > count ? rowsPerPage : newRowStart);
    }
  };

  return (
    <PaginationStack>
      <div className="flex items-center ">
        Rows per page:{' '}
        <StyledSelect
          value={rowsPerPage}
          onChange={(evt: any) => {
            onRowStartChange(0);
            onRowsPerPageChange(Number.parseInt(evt.target.value));
          }}
        >
          {paginationRowsPerPageOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </StyledSelect>
      </div>
      <div className="ml-4 mr-4">
        {to > 0 ? rowStart + 1 : 0} to {to} of {count}
      </div>
      <NavigationStack>
        <IconButton
          aria-label="Previous page"
          disabled={leftDisabled}
          variant="muted"
          onClick={() => onArrowClick('left')}
        >
          <Icon icon={ChevronLeftIcon} />
        </IconButton>
        <IconButton
          aria-label="Next page"
          variant="muted"
          disabled={rightDisabled}
          onClick={() => onArrowClick('right')}
        >
          <Icon icon={ChevronRightIcon} />
        </IconButton>
      </NavigationStack>
    </PaginationStack>
  );
}

const PaginationStack = styled.div`
  align-items: center;
  color: var(--fg-muted);
  display: flex;
  font-size: var(--text-sm);
  justify-content: flex-end;
  padding: var(--spacing-3) var(--spacing-3) 0;
  user-select: none;
`;

const StyledSelect = styled.select`
  -webkit-appearance: menulist;
  appearance: menulist;
  border-radius: var(--radius-lg);
  color: inherit;
  font-family: inherit;
  padding: 0 var(--spacing-1);
`;

const NavigationStack = styled.div`
  align-items: center;
  display: flex;
`;
