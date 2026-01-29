import type {ChangeEventHandler} from 'react';
import {useState} from 'react';
import styled from 'styled-components';
import {toClassName} from '../../style';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps {
  checked?: boolean;
  className?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  size?: SwitchSize;
  ref?: React.Ref<HTMLInputElement>;
}

export function Switch({
  checked,
  className,
  defaultChecked = false,
  disabled = false,
  onChange,
  ref,
  size = 'md',
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked);
  const currentChecked = isControlled ? checked! : internalChecked;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const newChecked = evt.currentTarget.checked;
    if (!disabled) {
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onChange?.(evt);
    }
  };

  return (
    <Root className={`${toClassName({disabled})} ${className || ''}`} $size={size}>
      <CheckboxInput
        ref={ref}
        type="checkbox"
        checked={currentChecked}
        disabled={disabled}
        onChange={handleChange}
        aria-checked={currentChecked}
      />
      <Circle className={toClassName({checked: currentChecked})} $size={size} />
      <Background className={toClassName({checked: currentChecked, disabled})} $size={size} />
    </Root>
  );
}

const SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
};

const PADDINGS = {
  sm: 4,
  md: 6,
  lg: 6,
};

const Root = styled.div<{
  $size: SwitchSize;
}>`
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: ${(p) => SIZES[p.$size] + PADDINGS[p.$size]}px;
  overflow: hidden;
  position: relative;
  vertical-align: middle;
  width: ${(p) => SIZES[p.$size] * 2.5 + PADDINGS[p.$size]}px;
  z-index: 0;

  &.disabled {
    cursor: default;
  }
`;

const Background = styled.div<{
  $size: SwitchSize;
}>`
  background: var(--border-subtle);
  border-radius: ${(p) => SIZES[p.$size]}px;
  height: 100%;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  width: 100%;
  z-index: -1;

  &.checked:not(.disabled) {
    background: var(--color-primary-600);
  }

  &.disabled:not(.checked) {
    background: var(--color-gray-250);
  }

  &.checked.disabled {
    background: var(--color-primary-300);
  }
`;

const Circle = styled.div<{$size: SwitchSize}>`
  background-color: var(--white);
  border-radius: 50%;
  pointer-events: none;
  position: absolute;
  left: ${(p) => PADDINGS[p.$size] / 2}px;
  top: ${(p) => PADDINGS[p.$size] / 2}px;
  bottom: ${(p) => PADDINGS[p.$size] / 2}px;
  height: ${(p) => SIZES[p.$size]}px;
  width: ${(p) => SIZES[p.$size]}px;
  transform: translateX(0);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

  &.checked {
    transform: translateX(${(p) => SIZES[p.$size] * 2.5 - SIZES[p.$size]}px);
  }
`;

const CheckboxInput = styled.input`
  cursor: inherit;
  inset: 0;
  margin: 0;
  opacity: 0; // Hide input
  padding: 0;
  position: absolute;
  z-index: 1;
`;
