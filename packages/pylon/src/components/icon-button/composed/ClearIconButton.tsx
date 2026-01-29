import {XIcon} from 'lucide-react';
import {styled} from 'styled-components';
import {Icon} from '../../icon/Icon';
import type {IconButtonProps} from '../IconButton';
import {IconButton} from '../IconButton';

type ClearIconButtonProps = Omit<IconButtonProps, 'icon' | 'variant' | 'size' | 'children'>;

export function ClearIconButton(props: ClearIconButtonProps) {
  return (
    <IconButton
      as="div"
      role="button"
      variant="unstyled"
      size="xxs"
      tabIndex={-1}
      aria-label="Reset value"
      {...props}
    >
      <StyledIcon icon={XIcon} size={14} strokeWidth={3} />
    </IconButton>
  );
}

const StyledIcon = styled(Icon)`
  background-color: var(--fg-subtle);
  color: var(--bg);
  padding: var(--spacing-0-5);
  flex-shrink: 0;
  border-radius: var(--radius-full);

  &:hover {
    background-color: var(--fg);
  }
`;
