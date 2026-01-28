import type {InputHTMLAttributes, RefObject} from 'react';
import styled, {css} from 'styled-components';

export type CheckboxSize = 'xs' | 'sm' | 'md';

/**
 * CheckboxProps
 * Extends the native input attributes for type="checkbox" with additional options:
 */
export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  className?: string;
  invalid?: boolean;
  label?: string;
  ref?: RefObject<HTMLInputElement | null>;
  size?: CheckboxSize;
};

/**
 * Checkbox
 * A styled checkbox component that supports multiple size variations.
 */
export function Checkbox({
  className,
  defaultChecked,
  disabled,
  label,
  onChange,
  ref,
  size = 'md',
  ...restProps
}: CheckboxProps) {
  return (
    <Root $size={size} className={className}>
      <CheckboxInput
        ref={ref}
        type="checkbox"
        disabled={disabled}
        defaultChecked={defaultChecked}
        onChange={(evt) => onChange?.(evt)}
        {...restProps}
      />
      {label && <Label>{label}</Label>}
    </Root>
  );
}

/**
 * Root
 * A wrapper div that includes the checkbox and optional label.
 * The size prop controls the overall padding.
 */
const Root = styled.div<{$size: CheckboxSize}>`
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  position: relative;
  user-select: none;
  vertical-align: middle;

  /* Adjust padding based on the size prop */
  ${({$size}) => {
    switch ($size) {
      case 'xs':
        return css`
          padding: 0.25rem;
        `;
      case 'sm':
        return css`
          padding: 0.4rem;
        `;
      case 'md':
      default:
        return css`
          padding: 0.5rem;
        `;
    }
  }}
`;

/**
 * CheckboxInput
 * The absolute-positioned native checkbox input.
 */
const CheckboxInput = styled.input`
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  cursor: inherit;
  z-index: 1;
`;

/**
 * Label
 * A text label placed next to the checkbox.
 */
const Label = styled.span`
  margin-left: 1.5rem;
`;
