import type {InputHTMLAttributes} from 'react';
import {useImperativeHandle, useLayoutEffect, useRef} from 'react';
import styled, {css} from 'styled-components';
import {toClassName} from '../../style';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  autofocus?: boolean;
  fullRounded?: boolean;
  invalid?: boolean;
  ref?: React.Ref<HTMLInputElement>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
};

export function Input({
  autofocus = false,
  className,
  fullRounded = false,
  invalid = false,
  ref,
  size = 'md',
  ...restProps
}: InputProps) {
  const innerRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => innerRef.current!);

  useLayoutEffect(() => {
    if (autofocus) {
      innerRef.current?.focus();
    }
  }, [autofocus]);

  return (
    <StyledInput
      ref={innerRef}
      autoComplete="off"
      spellCheck={false}
      aria-invalid={invalid}
      className={`${toClassName({
        invalid,
      })} ${className}`}
      $size={size}
      $fullRounded={fullRounded}
      {...restProps}
    />
  );
}

const StyledInput = styled.input<{
  $size: InputProps['size'];
  $fullRounded: InputProps['fullRounded'];
}>`
  align-items: center;
  background: transparent;
  border: 1px solid var(--input-border-color);
  color: var(--fg-body);
  display: inline-flex;
  height: var(--input-height-${(p) => p.$size});
  outline: 0;
  padding: 0 var(--input-padding-${(p) => p.$size});

  ${({$fullRounded, $size}) =>
    $fullRounded
      ? css`
          border-radius: var(--radius-full);
        `
      : css`
          border-radius: var(--input-radius-${$size});
        `}

  &:disabled {
    cursor: not-allowed;
  }

  &.invalid {
    border-color: var(--input-outline-error-color);
  }

  &:focus-visible {
    border-color: var(--input-outline-color);
    outline: 1px solid var(--input-outline-color);
  }

  &::placeholder {
    color: var(--fg-placeholder);
  }

  &[disabled] {
    color: var(--fg-placeholder);
  }

  &[readonly] {
    background-color: var(--bg-soft);
    color: var(--fg-placeholder);
    pointer-events: none;
  }
`;
