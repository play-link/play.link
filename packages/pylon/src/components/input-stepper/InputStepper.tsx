import {MinusCircleIcon, PlusCircleIcon, Trash2Icon} from 'lucide-react';
import {useCallback} from 'react';
import styled from 'styled-components';

type InputStepperSize = 'sm' | 'md' | 'lg';

export interface InputStepperProps {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value allowed */
  min?: number;
  /** Maximum value allowed */
  max?: number;
  /** Step increment/decrement amount */
  step?: number;
  /** Component size */
  size?: InputStepperSize;
  /** Disabled state */
  disabled?: boolean;
  /** Optional label to display after the value */
  label?: string;
  /** Accessible name for the stepper */
  'aria-label'?: string;
  /** Additional CSS class for the container */
  className?: string;
  /** Whether the stepper should take full width */
  fullWidth?: boolean;
  /** Show bin icon instead of disabled minus when at min value */
  showRemoveAtMin?: boolean;
  /** Callback when bin icon is clicked (only when showRemoveAtMin is true) */
  onRemove?: () => void;
}

const ICON_SIZES: Record<InputStepperSize, number> = {
  sm: 18,
  md: 22,
  lg: 26,
};

export function InputStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  size = 'md',
  disabled = false,
  label,
  'aria-label': ariaLabel,
  className,
  fullWidth = false,
  showRemoveAtMin = false,
  onRemove,
}: InputStepperProps) {
  const isAtMin = value <= min;
  const canDecrement = !disabled && !isAtMin;
  const canIncrement = !disabled && value < max;
  const showBinIcon = showRemoveAtMin && isAtMin && onRemove;

  const handleDecrement = useCallback(() => {
    if (canDecrement) {
      const numValue = typeof value === 'string' ? Number(value) : value;
      onChange(Math.max(min, numValue - step));
    }
  }, [canDecrement, min, onChange, step, value]);

  const handleIncrement = useCallback(() => {
    if (canIncrement) {
      const numValue = typeof value === 'string' ? Number(value) : value;
      onChange(Math.min(max, numValue + step));
    }
  }, [canIncrement, max, onChange, step, value]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
    }
  }, [onRemove]);

  const iconSize = ICON_SIZES[size];

  return (
    <Container
      $disabled={disabled}
      $fullWidth={fullWidth}
      aria-label={ariaLabel}
      className={className}
    >
      {showBinIcon ? (
        <IconButton type="button" onClick={handleRemove} aria-label="Remove item">
          <Trash2Icon size={20} />
        </IconButton>
      ) : (
        <IconButton
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          aria-label="Decrease value"
        >
          <MinusCircleIcon size={iconSize} />
        </IconButton>
      )}

      <ValueDisplay $size={size} $fullWidth={fullWidth}>
        <span>{value}</span>
        {label && <span className="fg-muted ml-1">{label}</span>}
      </ValueDisplay>

      <IconButton
        type="button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label="Increase value"
      >
        <PlusCircleIcon size={iconSize} />
      </IconButton>
    </Container>
  );
}

// Styled components
const Container = styled.div<{
  $disabled: boolean;
  $fullWidth: boolean;
}>`
  align-items: center;
  display: ${({$fullWidth}) => ($fullWidth ? 'flex' : 'inline-flex')};
  gap: var(--spacing-1);
  opacity: ${({$disabled}) => ($disabled ? 0.5 : 1)};
  width: ${({$fullWidth}) => ($fullWidth ? '100%' : 'auto')};
`;

const IconButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--fg-body);
  cursor: pointer;
  display: flex;
  justify-content: center;
  padding: 0;
  transition: color 0.15s ease;

  &:hover:not(:disabled) {
    color: var(--fg-body);
  }

  &:disabled {
    color: var(--fg-placeholder);
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--input-outline-color);
    outline-offset: 2px;
  }
`;

const ValueDisplay = styled.div<{
  $size: InputStepperSize;
  $fullWidth: boolean;
}>`
  align-items: center;
  display: flex;
  flex: ${({$fullWidth}) => ($fullWidth ? 1 : 'none')};
  justify-content: center;
  min-width: 1.5rem;
  padding: 0 var(--spacing-1);
  user-select: none;
`;
