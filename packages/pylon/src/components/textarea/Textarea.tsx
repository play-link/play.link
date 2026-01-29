import type {TextareaHTMLAttributes} from 'react';
import styled from 'styled-components';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({invalid, className, ...rest}: TextareaProps) {
  return <StyledTextarea className={`${className} ${invalid ? 'invalid' : ''}`} {...rest} />;
}

const StyledTextarea = styled.textarea`
  border-radius: var(--control-radius-md);
  border: 1px solid var(--input-border-color);
  color: var(--fg);
  outline: 0;
  padding: var(--control-padding-md);
  resize: none;

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
`;
