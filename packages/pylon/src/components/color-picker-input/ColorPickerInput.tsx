import {useCallback, useRef, useState} from 'react';
import {HexColorPicker} from 'react-colorful';
import styled from 'styled-components';
import {Overlay} from '../overlay';

export interface ColorPickerInputProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export function ColorPickerInput({value, onChange, disabled}: ColorPickerInputProps) {
  const [opened, setOpened] = useState(false);
  const swatchRef = useRef<HTMLButtonElement>(null);

  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow typing: keep # prefix, only hex chars
      const cleaned = `#${  raw.replace(/[^0-9a-f]/gi, '').slice(0, 6)}`;
      onChange(cleaned);
    },
    [onChange],
  );

  return (
    <Wrapper>
      <Swatch
        ref={swatchRef}
        type="button"
        $color={value}
        onClick={() => !disabled && setOpened(true)}
        disabled={disabled}
        aria-label="Pick color"
      />
      <HexInput
        type="text"
        value={value}
        onChange={handleHexInput}
        disabled={disabled}
        spellCheck={false}
      />

      <Overlay
        opened={opened}
        setOpened={setOpened}
        cancelOnEscKey
        cancelOnOutsideClick
        isModal={false}
        position={{
          mode: 'absolute',
          fitToScreen: true,
          flip: true,
          verticalOffset: 6,
          positionTarget: swatchRef.current,
        }}
      >
        <PickerDropdown>
          <HexColorPicker color={value} onChange={onChange} />
          <DropdownHexRow>
            <DropdownHexLabel>HEX</DropdownHexLabel>
            <DropdownHexInput
              type="text"
              value={value}
              onChange={handleHexInput}
              spellCheck={false}
            />
          </DropdownHexRow>
        </PickerDropdown>
      </Overlay>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const Swatch = styled.button<{$color: string}>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-full);
  border: 2px solid var(--border);
  background: ${(p) => p.$color || '#000'};
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s;

  &:hover:not(:disabled) {
    border-color: var(--fg-muted);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HexInput = styled.input`
  width: 5.5rem;
  height: var(--control-height-sm);
  padding: 0 var(--spacing-2);
  background: transparent;
  border: 1px solid var(--input-border-color);
  border-radius: var(--control-radius-sm);
  color: var(--fg);
  font-size: var(--text-sm);
  font-family: monospace;

  &:focus {
    border-color: var(--input-outline-color);
    outline: 1px solid var(--input-outline-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PickerDropdown = styled.div`
  background: var(--bg-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);

  .react-colorful {
    width: 200px !important;
    height: 160px !important;
  }

  .react-colorful__saturation {
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }

  .react-colorful__hue {
    border-radius: 0 0 var(--radius-md) var(--radius-md);
    height: 12px;
  }

  .react-colorful__pointer {
    width: 16px;
    height: 16px;
  }
`;

const DropdownHexRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const DropdownHexLabel = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
  font-weight: var(--font-weight-medium);
`;

const DropdownHexInput = styled.input`
  flex: 1;
  height: var(--control-height-xs);
  padding: 0 var(--spacing-2);
  background: var(--bg-muted);
  border: 1px solid var(--border-muted);
  border-radius: var(--control-radius-xs);
  color: var(--fg);
  font-size: var(--text-sm);
  font-family: monospace;

  &:focus {
    border-color: var(--input-outline-color);
    outline: 1px solid var(--input-outline-color);
  }
`;
