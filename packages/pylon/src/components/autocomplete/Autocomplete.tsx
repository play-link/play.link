import type {ReactNode} from 'react';
import {useRef, useState} from 'react';
import styled from 'styled-components';
import {dropdownOverlayCss} from '../../style';
import {Button} from '../button';
import type {InputProps} from '../input';
import {Input} from '../input';
import {NavigationList} from '../navigation-list';
import {Overlay} from '../overlay';

export interface AutocompleteProps<T> extends Omit<InputProps, 'value' | 'onChange' | 'onSelect'> {
  /** Current input value */
  value: string;
  /** Called when input value changes */
  onChange: (value: string) => void;
  /** Items to display in the dropdown */
  items: T[];
  /** Called when an item is selected */
  onSelect: (item: T) => void;
  /** Render function for each item */
  renderItem: (item: T, isDisabled: boolean) => ReactNode;
  /** Optional function to determine if an item is disabled */
  isItemDisabled?: (item: T) => boolean;
  /** Optional header text for the dropdown */
  header?: string;
  /** Text to show when there are no items */
  noResultsText?: string;
}

export function Autocomplete<T>({
  value,
  onChange,
  onBlur,
  items,
  onSelect,
  renderItem,
  isItemDisabled,
  header,
  noResultsText,
  ...inputProps
}: AutocompleteProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const hasSelectableItems = isItemDisabled
    ? items.some((item) => !isItemDisabled(item))
    : items.length > 0;

  const showDropdown = isFocused && (hasSelectableItems || noResultsText);
  const showNoResults = isFocused && !hasSelectableItems && noResultsText;

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  return (
    <>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.({} as React.FocusEvent<HTMLInputElement>);
        }}
        autoComplete="off"
        {...inputProps}
      />
      <StyledOverlay
        triggerRef={inputRef}
        opened={!!showDropdown}
        setOpened={setIsFocused}
        position={{
          positionTarget: inputRef.current,
          verticalAlign: 'top',
          verticalOffset: 4,
          horizontalAlign: 'left',
          fitToScreen: true,
        }}
        cancelOnEscKey
        noAutoFocus
      >
        <DropdownContent onMouseDown={(e) => e.preventDefault()}>
          {header && <DropdownHeader>{header}</DropdownHeader>}
          {showNoResults ? (
            <NoResults>{noResultsText}</NoResults>
          ) : (
            <NavigationList externalEventTargetRef={inputRef} noAutoFocus>
              {items.map((item, index) => {
                const isDisabled = isItemDisabled?.(item) ?? false;
                return (
                  <Button
                    key={index}
                    variant="menu"
                    onClick={() => handleSelect(item)}
                    disabled={isDisabled}
                  >
                    {renderItem(item, isDisabled)}
                  </Button>
                );
              })}
            </NavigationList>
          )}
        </DropdownContent>
      </StyledOverlay>
    </>
  );
}

const StyledOverlay = styled(Overlay)`
  ${dropdownOverlayCss}
  max-height: 240px;
  overflow-y: auto;
`;

const DropdownContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const DropdownHeader = styled.div`
  padding: var(--spacing-1-5) var(--spacing-3) var(--spacing-1);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-xs);
  color: var(--fg-muted);
`;

const NoResults = styled.div`
  padding: var(--spacing-3);
  font-size: var(--text-sm);
  color: var(--fg-muted);
  text-align: center;
`;
