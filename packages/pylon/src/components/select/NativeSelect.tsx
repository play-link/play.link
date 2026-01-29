import type {HTMLAttributes} from 'react';
import styled from 'styled-components';

type Options = Array<{
  [key: string]: string;
}>;

export interface NativeSelectProps {
  defaultValue?: string;
  id?: string;
  invalid?: boolean;
  options?: Options;
  propertyForLabel?: string;
}

const DEFAULT_OPTIONS: Options = [];

type Props = HTMLAttributes<HTMLSelectElement> & NativeSelectProps;

export function NativeSelect({
  ref,
  id,
  invalid = false,
  defaultValue,
  propertyForLabel = 'label',
  options = DEFAULT_OPTIONS,
  ...restProps
}: Props & {ref?: React.RefObject<HTMLSelectElement | null>}) {
  return (
    <StyledSelect id={id} ref={ref} $invalid={invalid} {...restProps}>
      {options.map((option) => (
        <option key={option.value} value={option.value} selected={defaultValue === option.value}>
          {option[propertyForLabel]}
        </option>
      ))}
    </StyledSelect>
  );
}

interface StyledSelectProps {
  $invalid: boolean;
}

const StyledSelect = styled.select<StyledSelectProps>`
  background: var(--input-bg);
  border: ${({$invalid}) =>
    $invalid
      ? '1px solid var(--input-outline-error-color)'
      : '1px solid var(--input-border-color)'};
  border-radius: var(--control-radius-md);
  color: var(--input-color);
  display: inline-block;
  height: var(--control-height-md);
  outline: 0;
  padding: var(--control-padding-md);
  text-decoration: none;
  text-overflow: ellipsis;

  &:focus {
    border-color: ${({$invalid}) =>
      $invalid ? 'var(--input-outline-error-color)' : 'var(--input-outline-color)'};
    box-shadow: inset 0 0 0 1px
      ${({$invalid}) =>
        $invalid ? 'var(--input-outline-error-color)' : 'var(--input-outline-color)'};
  }
`;
