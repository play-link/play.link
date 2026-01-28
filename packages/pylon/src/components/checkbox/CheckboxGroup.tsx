import type {ChangeEvent} from 'react';
import {useState} from 'react';
import {styled} from 'styled-components';
import {Button} from '../button';
import {Checkbox} from './Checkbox';

const DEFAULT_CHECKED: Option['value'][] = [];

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  defaultChecked?: Option['value'][];
  onChange?: (value: Option['value'][]) => void;
  maxOptions?: number;
}

export function CheckboxGroup({
  options,
  defaultChecked = DEFAULT_CHECKED,
  onChange,
  maxOptions = Infinity,
  ...props
}: Props) {
  const [displayAll, setDisplayAll] = useState(false);
  const [state, setState] = useState(defaultChecked);

  const handleCheckboxChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const value = (evt.target as HTMLInputElement).value;
    const newState = state.includes(value) ? state.filter((v) => v !== value) : [...state, value];
    setState(newState);
    onChange?.(newState);
  };

  const filteredOptions = displayAll ? options : options.slice(0, maxOptions);

  return (
    <div {...props}>
      {filteredOptions.map((option) => (
        <div key={option.value}>
          <Checkbox
            value={option.value}
            label={option.label}
            defaultChecked={defaultChecked.includes(option.value) || state.includes(option.value)}
            onChange={handleCheckboxChange}
          />
        </div>
      ))}
      {options.length > maxOptions && (
        <StyledButton variant="unstyled" onClick={() => setDisplayAll(!displayAll)}>
          View {displayAll ? 'less' : 'more'}
        </StyledButton>
      )}
    </div>
  );
}

const StyledButton = styled(Button)`
  color: var(--color-blue-300);
  &:hover {
    color: var(--color-blue-900);
  }
`;
