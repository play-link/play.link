import {CheckIcon, ChevronDownIcon} from 'lucide-react';
import type {ForwardedRef, HTMLAttributes, RefObject, SelectHTMLAttributes} from 'react';
import {useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState} from 'react';
import styled, {css} from 'styled-components';
import {afterNextRender, isSmallScreen, scrollIntoView} from '../../lib';
import {dropdownOverlayCss, scrollBarCss, toClassName} from '../../style';
import {Button} from '../button';
import {Checkbox} from '../checkbox';
import {Divider} from '../divider';
import {Icon} from '../icon';
import {ClearIconButton} from '../icon-button';
import {Input} from '../input';
import {Loading} from '../loading';
import {NavigationList} from '../navigation-list';
import type {OverlayPosition} from '../overlay';
import {Overlay} from '../overlay';
import {selectVariantsStyles} from './variants';
import type {SelectVariant} from './variants';

// Define a type for individual options
export interface SelectOption {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string | number;
}

// Define a type for option groups (with a category title)
export interface SelectOptionGroup {
  title: string;
  options: SelectOption[];
}

interface BaseProps {
  cancellable?: boolean;
  defaultValue?: string | number | (string | number)[];
  disabled?: boolean;
  emptyMessage?: string | React.ReactNode;
  formatSelectedLabel?: (option: SelectOption) => string;
  fullWidth?: boolean;
  fullRounded?: boolean;
  id?: string;
  invalid?: boolean;
  loading?: boolean;
  multiple?: boolean;
  name?: string;
  noShrink?: boolean;
  onChange?: SelectHTMLAttributes<HTMLSelectElement>['onChange'];
  options: (SelectOption | SelectOptionGroup)[];
  overlayPosition?: Partial<OverlayPosition>;
  placeholder?: string;
  ref?: ForwardedRef<HTMLButtonElement>;
  roundedTrigger?: boolean;
  searchable?: boolean;
  size?: 'xs' | 'sm' | 'md';
  value?: string | number | (string | number)[];
  variant?: SelectVariant;
}

export type SelectProps = Omit<HTMLAttributes<HTMLDivElement>, keyof BaseProps> & BaseProps;

export function Select({
  cancellable = false,
  className,
  defaultValue,
  disabled = false,
  emptyMessage,
  formatSelectedLabel,
  fullWidth = false,
  fullRounded = false,
  id,
  invalid = false,
  loading = false,
  multiple = false,
  name,
  noShrink = false,
  onChange,
  options,
  overlayPosition,
  placeholder = 'Select an option',
  ref,
  searchable = false,
  size = 'md',
  value,
  variant = 'default',
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [opened, setOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fixedOverlayWidth, setFixedOverlayWidth] = useState<string | null>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | number | (string | number)[]>(
    multiple ? defaultValue || [] : defaultValue || '',
  );
  const selectedValue = isControlled ? value : internalValue;

  useImperativeHandle(ref, () => triggerRef.current!);

  // Flatten options (whether grouped or not) for easy lookup
  const flatOptions: SelectOption[] = useMemo(
    () =>
      options.reduce((acc: SelectOption[], opt) => {
        if ('options' in opt) {
          acc.push(...opt.options);
        } else {
          acc.push(opt);
        }
        return acc;
      }, []),
    [options],
  );

  const isSelected = (val: string | number) =>
    multiple ? (selectedValue as (string | number)[]).includes(val) : selectedValue === val;

  const selectedOptions = flatOptions.filter((opt) => isSelected(opt.value));

  const selectOption = (val: string | number) => {
    const option = flatOptions.find((o) => o.value === val);
    if (option?.disabled) {
      return;
    }

    let newValue: string | number | (string | number)[];

    if (multiple) {
      const current = selectedValue as (string | number)[];
      newValue = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    } else {
      newValue = val;
      setSearchQuery('');
      setOpened(false);
      // Focus the trigger after the overlay closes
      afterNextRender(() => {
        triggerRef.current?.focus();
      });
    }

    setInternalValue(newValue);

    const modifiedEvt = {
      target: {
        name,
        value: newValue,
      },
    };
    onChange?.(modifiedEvt as any);
  };

  // Reset search query when overlay is closed
  useEffect(() => {
    if (!opened) {
      setSearchQuery('');
    }
  }, [opened]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) {
      return options;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();

    const matchesOption = (item: SelectOption) =>
      item.label.toLowerCase().includes(lowerCaseQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseQuery));

    return options
      .map((opt) => {
        if ('options' in opt) {
          // Filter options within the group
          const filteredGroupOptions = opt.options.filter(matchesOption);
          // Return the group only if it has matching options
          return filteredGroupOptions.length > 0 ? {...opt, options: filteredGroupOptions} : null;
        } else {
          // Filter individual options
          return matchesOption(opt) ? opt : null;
        }
      })
      .filter((opt): opt is SelectOption | SelectOptionGroup => opt !== null); // Remove null entries
  }, [options, searchQuery, searchable]);

  const flatFilteredOptions = useMemo(
    () => filteredOptions.flatMap((opt) => ('options' in opt ? opt.options : opt)),
    [filteredOptions],
  );

  const initialFocusedIndex = useMemo(() => {
    if (selectedOptions.length > 0) {
      const firstSelected = selectedOptions[0];
      const index = flatFilteredOptions.findIndex((opt) => opt.value === firstSelected.value);
      return index > -1 ? index : null;
    }
    return null;
  }, [selectedOptions, flatFilteredOptions]);

  const handleTriggerMousedown = (evt: React.MouseEvent) => {
    if (disabled) return;
    evt.preventDefault();
    setOpened((prev) => !prev);
  };

  const handleTriggerKeydown = (evt: React.KeyboardEvent) => {
    if (disabled) return;
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      setOpened((prev) => !prev);
    }
  };

  const handleCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const emptyValue = multiple ? [] : '';
    setInternalValue(emptyValue);
    onChange?.({
      target: {
        name,
        value: emptyValue,
      },
    } as any);

    setOpened(false);

    // Focus the trigger after the overlay closes
    afterNextRender(() => {
      triggerRef.current?.focus();
    });
  };

  const handleClearKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel(e);
    }
  };

  useEffect(() => {
    let exists: boolean;
    if (multiple) {
      exists = (selectedValue as (string | number)[]).every((v) =>
        flatOptions.some((opt) => opt.value === v),
      );
    } else {
      exists = flatOptions.some((opt) => opt.value === selectedValue);
    }
    if (!exists && (multiple ? (selectedValue as any[]).length > 0 : selectedValue !== '')) {
      const warnValue = multiple ? (selectedValue as any[]).join(', ') : selectedValue;
      if (isControlled) {
        console.warn(`Select: Controlled value "${warnValue}" not found in options.`);
      } else {
        console.warn(
          `Select: Uncontrolled value "${warnValue}" not found in options. Resetting to empty.`,
        );
        setInternalValue(multiple ? [] : '');
      }
    }
  }, [flatOptions, selectedValue, isControlled, onChange, name, multiple]);

  const handleSearchInputKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    const query = evt.currentTarget.value.trim();
    if (evt.key === 'Enter' && filteredOptions.length > 0 && query.length) {
      evt.preventDefault();

      // Determine the value of the first visible option
      const firstOption = filteredOptions[0];
      let firstValue: string | number | undefined;

      if ('options' in firstOption) {
        // It's a group, get the first option within it
        if (firstOption.options.length > 0) {
          firstValue = firstOption.options[0].value;
        }
      } else {
        // It's a regular option
        firstValue = firstOption.value;
      }

      if (firstValue !== undefined) {
        selectOption(firstValue);
      }
    }
    // Note: Arrow key handling is managed by NavigationList via externalEventTargetRef
  };

  // Effect to explicitly focus search input when overlay opens and is searchable
  useEffect(() => {
    if (opened && searchable && searchInputRef.current) {
      // Use setTimeout to ensure focus happens after potential rendering/animation delays
      const timerId = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
      // Cleanup the timeout if the component unmounts or dependencies change before it fires
      return () => clearTimeout(timerId);
    }
  }, [opened, searchable]); // Rerun when opened state or searchable prop changes

  // Effect to capture initial overlay width and fix it
  useLayoutEffect(() => {
    if (opened && fixedOverlayWidth === null && overlayRef.current) {
      // Capture width only when opening and not already set
      setFixedOverlayWidth(`${overlayRef.current.offsetWidth}px`);
    } else if (!opened) {
      // Reset width when closed
      setFixedOverlayWidth(null);
    }
    // Depend on opened state and the width state itself to prevent loops if needed
  }, [opened, fixedOverlayWidth]);

  // Effect to scroll to the selected option when the dropdown opens or filters change
  useEffect(() => {
    if (opened && selectedOptions.length > 0) {
      const firstSelectedValue = selectedOptions[0].value;
      const selectedOptionElement = optionRefs.current[String(firstSelectedValue)];
      if (selectedOptionElement) {
        // Using setTimeout to ensure the element is fully rendered and available
        setTimeout(() => {
          scrollIntoView(selectedOptionElement, {
            behavior: 'instant',
            block: 'center',
          });
        }, 0);
      }
    }
  }, [opened, selectedOptions, filteredOptions]); // Add filteredOptions to trigger on search changes

  // Reset optionRefs when options change to avoid stale refs (important if options are highly dynamic)
  useEffect(() => {
    optionRefs.current = {};
  }, [options]);

  const renderOption = (option: SelectOption) => {
    return (
      <div
        key={option.value}
        ref={(el) => {
          optionRefs.current[String(option.value)] = el;
        }}
      >
        <OptionButton
          onClick={() => selectOption(option.value)}
          variant="menu"
          className={toClassName({
            'has-description': !!option.description,
            'w-full': true,
          })}
          size="sm"
          role="option"
          type="button"
          data-value={option.value}
          aria-selected={isSelected(option.value)}
          disabled={option.disabled}
          aria-checked={multiple ? isSelected(option.value) : undefined}
        >
          {multiple ? (
            <Checkbox checked={isSelected(option.value)} className="mr-1" />
          ) : isSelected(option.value) ? (
            <Icon icon={CheckIcon} size={16} strokeWidth={2} />
          ) : (
            <span />
          )}
          <span className={isSelected(option.value) ? 'font-semibold' : ''}>{option.label}</span>
          {!!option.description && (
            <div className="fg-muted text-sm pl-6 description">{option.description}</div>
          )}
        </OptionButton>
      </div>
    );
  };

  return (
    <>
      <SelectButton
        ref={triggerRef}
        type="button"
        onMouseDown={handleTriggerMousedown}
        onKeyDown={handleTriggerKeydown}
        tabIndex={0}
        disabled={disabled}
        className={`${toClassName({
          opened,
          invalid: !loading && invalid,
          placeholder: selectedOptions.length === 0,
        })} ${className}`}
        $size={size}
        $fullWidth={fullWidth}
        $variant={variant}
        $noShrink={noShrink}
        $fullRounded={fullRounded}
        data-opened={opened}
        aria-expanded={opened}
        aria-label={!id ? placeholder : undefined}
        role="combobox"
        aria-haspopup="listbox"
        aria-controls="select-overlay"
        aria-invalid={invalid}
      >
        <span className="select-label">
          {loading ? (
            <div className="flex items-center">
              <Loading size={14} />
            </div>
          ) : selectedOptions.length === 0 ? (
            placeholder
          ) : (
            selectedOptions
              .map((option) => (formatSelectedLabel ? formatSelectedLabel(option) : option.label))
              .join(', ')
          )}
        </span>
        {cancellable && selectedOptions.length > 0 && (
          <ClearIconButton
            onKeyDown={handleClearKeyDown as any}
            onMouseDown={handleCancel}
            className="ml-1"
          />
        )}
        <Icon icon={ChevronDownIcon} size={15} className="arrow-icon" strokeWidth={2} />
      </SelectButton>
      <Overlay
        ref={overlayRef}
        id="select-overlay"
        opened={opened}
        setOpened={setOpened}
        cancelOnEscKey
        cancelOnOutsideClick
        withBackdrop={isSmallScreen}
        transparentBackdrop
        noAutoFocus={searchable}
        triggerRef={triggerRef}
        modalCss={css`
          ${dropdownOverlayCss}
          ${scrollBarCss}
          width: ${fixedOverlayWidth ?? 'auto'};
          padding: 0;
          overflow: hidden;
        `}
        position={{
          fitToScreen: true,
          positionTarget: triggerRef.current,
          verticalOffset: 2,
          ...overlayPosition,
        }}
      >
        {searchable && (
          <SearchInputWrapper>
            <Input
              ref={searchInputRef}
              name="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchInputKeyDown}
              size="sm"
              autoComplete="off"
              autoCorrect="off"
              className="w-full"
            />
          </SearchInputWrapper>
        )}
        <OptionsWrapper role="listbox" aria-multiselectable={multiple}>
          {searchable && searchQuery && filteredOptions.length === 0 ? (
            <NoResultsMessage>No results found for "{searchQuery}".</NoResultsMessage>
          ) : filteredOptions.length === 0 ? (
            <NoResultsMessage>{emptyMessage || 'No options available.'}</NoResultsMessage>
          ) : (
            <NavigationList
              externalEventTargetRef={searchInputRef as RefObject<HTMLElement>}
              initialFocusedIndex={initialFocusedIndex}
            >
              {filteredOptions.map((opt, index) => {
                if ('options' in opt) {
                  return (
                    <div key={opt.title}>
                      {index > 0 && (
                        <Divider bleedSpacing={1} className="mt-2 mb-0.5" variant="subtle" />
                      )}
                      <CategoryTitle>{opt.title}</CategoryTitle>
                      {opt.options.map(renderOption)}
                    </div>
                  );
                } else {
                  return renderOption(opt);
                }
              })}
            </NavigationList>
          )}
        </OptionsWrapper>
      </Overlay>
    </>
  );
}

const SelectButton = styled.button<{
  $fullRounded?: boolean;
  $fullWidth?: boolean;
  $noShrink?: boolean;
  $size?: SelectProps['size'];
  $variant?: SelectVariant;
}>`
  align-items: center;
  color: inherit;
  cursor: var(--button-cursor, pointer);
  display: inline-flex;
  gap: var(--spacing-1);
  height: var(--input-height-${(p) => p.$size});
  overflow: hidden;
  padding: var(--button-padding-${(p) => p.$size});
  text-align: center;
  transition-duration: 0.3s;
  transition-property: background-color, color;
  transition-timing-function: var(--ease-in-out);
  user-select: none;

  ${(p) =>
    p.$fullRounded
      ? css`
          border-radius: var(--radius-full);
        `
      : css`
          border-radius: var(--input-radius-${p.$size});
        `}

  ${(p) =>
    p.$noShrink
      ? css`
          flex-shrink: 0;
        `
      : ''}

  .arrow-icon {
    color: var(--fg-muted);
    flex-shrink: 0;
  }

  ${(p) =>
    p.$fullWidth
      ? css`
          width: 100%;
          justify-content: space-between;
        `
      : css`
          justify-content: flex-start;
        `}

  > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:focus-visible {
    border-color: var(--input-outline-color);
    outline: 1px solid var(--input-outline-color);
  }

  ${(p) => selectVariantsStyles[p.$variant ?? 'default']}
`;

const OptionButton = styled(Button)`
  width: 100%;
  align-items: center;
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  height: auto;
  min-height: var(--button-height-md);
  padding-right: var(--spacing-3);
  text-align: left;

  .description {
    grid-area: 2 / 1 / 3 / 3;
    line-height: var(--leading-normal);
    white-space: normal;
    margin-top: var(--spacing-1);
  }

  &.has-description {
    grid-template-rows: 1fr auto;
    padding-bottom: var(--spacing-2);
    padding-top: var(--spacing-2);
  }
`;

const CategoryTitle = styled.div`
  color: var(--fg-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-2) 0 var(--spacing-0-5) 36px;
`;

const SearchInputWrapper = styled.div`
  border-bottom: 1px solid var(--border-soft);
  padding: var(--spacing-2) var(--spacing-2);
`;

const OptionsWrapper = styled.div`
  max-height: 20rem;
  overflow-y: auto;
  padding: var(--spacing-1);
`;

const NoResultsMessage = styled.div`
  align-items: center;
  color: var(--fg-muted);
  display: flex;
  min-height: var(--button-height-md);
  padding: var(--button-padding-md);
`;
