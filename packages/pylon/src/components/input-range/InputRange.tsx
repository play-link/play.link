import type {InputHTMLAttributes} from 'react';
import styled, {css} from 'styled-components';

type Props = InputHTMLAttributes<HTMLInputElement>;

export function NativeInputRange(props: Props) {
  return <StyledInput type="range" {...props} />;
}

const thumbStyles = css`
  -webkit-appearance: none;
  -moz-appearance: none;
  border: 1px solid var(--fg-body);
  background: var(--fg-body);
  border-radius: var(--radius-full);
  width: 0.875rem;
  height: 0.875rem;
  transition: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
`;

const StyledInput = styled.input`
  -webkit-appearance: none;
  -moz-appearance: none;
  height: 0.1875rem;
  border-top: white;
  border-bottom: white;
  background: var(--border-soft);
  width: 100%;

  &::-moz-range-thumb {
    ${thumbStyles}
  }

  &::-webkit-slider-thumb {
    ${thumbStyles}
  }
`;
