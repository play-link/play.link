import {ClockIcon} from 'lucide-react';
import type {ForwardedRef, InputHTMLAttributes} from 'react';
import {useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import styled, {css} from 'styled-components';
import {dropdownOverlayCss, scrollBarCss} from '../../style';
import {Button} from '../button';
import {IconButton} from '../icon-button';
import {Input} from '../input';
import type {OverlayPosition} from '../overlay';
import {Overlay} from '../overlay';

export interface TimePickerInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'size'
> {
  disabled?: boolean;
  fullRounded?: boolean;
  fullWidth?: boolean;
  invalid?: boolean;
  /** Minimum allowed time in "HH:mm" format (e.g., "06:00") */
  minTime?: string;
  /** Maximum allowed time in "HH:mm" format (e.g., "20:00") */
  maxTime?: string;
  onChange?: (value: string) => void;
  /** Called when input loses focus - useful for triggering validation */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Called when editing state changes (true = editing, false = not editing) */
  onEditingChange?: (isEditing: boolean) => void;
  overlayPosition?: Partial<OverlayPosition>;
  placeholder?: string;
  ref?: ForwardedRef<HTMLInputElement>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  value?: string; // Format: "HH:mm" (24-hour format)
}

// Generate hours (00-23)
const ALL_HOURS = Array.from({length: 24}, (_, i) => ({
  label: i.toString().padStart(2, '0'),
  value: i,
}));

// Generate minutes (00-59)
const ALL_MINUTES = Array.from({length: 60}, (_, i) => ({
  label: i.toString().padStart(2, '0'),
  value: i,
}));

// Parse time string to hours and minutes
function parseTime(time: string | undefined): {hour: number; minute: number} | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;
  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return {hour, minute};
}

// Format hours and minutes to time string
function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

type SelectedPart = 'hour' | 'minute';

export function TimePickerInput({
  className,
  disabled = false,
  fullRounded = false,
  fullWidth = false,
  invalid = false,
  minTime,
  maxTime,
  onChange,
  onBlur,
  onEditingChange,
  overlayPosition,
  placeholder = 'hh:mm',
  ref,
  size = 'md',
  value = '',
  ...restProps
}: TimePickerInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const hourColumnRef = useRef<HTMLDivElement | null>(null);
  const minuteColumnRef = useRef<HTMLDivElement | null>(null);

  // Track pending selection to apply after render
  const pendingSelectionRef = useRef<SelectedPart | null>(null);

  // Store the original value when dropdown opens (for cancel)
  const originalValueRef = useRef<string>('');

  const [opened, setOpened] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '00:00');
  const [selectedPart, setSelectedPart] = useState<SelectedPart>('hour');
  const [dropdownHour, setDropdownHour] = useState(() => {
    const time = parseTime(value);
    return time?.hour ?? 0;
  });
  const [dropdownMinute, setDropdownMinute] = useState(() => {
    const time = parseTime(value);
    return time?.minute ?? 0;
  });

  // Track if user is currently editing (focused on input)
  const [isEditing, setIsEditing] = useState(false);

  // Buffer for typing - stores partial input while user types
  const typingBufferRef = useRef<string>('');
  // Track latest hour/minute during typing to avoid stale state
  const latestTypedTimeRef = useRef<{hour: number; minute: number}>({
    hour: 0,
    minute: 0,
  });

  const isControlled = value !== undefined && value !== '';
  const displayValue = isControlled ? value : internalValue;

  useImperativeHandle(ref, () => inputRef.current!);

  // Parse min/max time constraints
  const minTimeParsed = useMemo(() => parseTime(minTime), [minTime]);
  const maxTimeParsed = useMemo(() => parseTime(maxTime), [maxTime]);

  // Filter hours based on min/max time
  const filteredHours = useMemo(() => {
    const minHour = minTimeParsed?.hour ?? 0;
    const maxHour = maxTimeParsed?.hour ?? 23;
    return ALL_HOURS.filter((h) => h.value >= minHour && h.value <= maxHour);
  }, [minTimeParsed, maxTimeParsed]);

  // Filter minutes based on selected hour and min/max time
  const getFilteredMinutes = useCallback(
    (hour: number) => {
      const minHour = minTimeParsed?.hour ?? 0;
      const maxHour = maxTimeParsed?.hour ?? 23;
      const minMinute = minTimeParsed?.minute ?? 0;
      const maxMinute = maxTimeParsed?.minute ?? 59;

      return ALL_MINUTES.filter((m) => {
        // If at minimum hour, filter out minutes below minimum
        if (hour === minHour && m.value < minMinute) return false;
        // If at maximum hour, filter out minutes above maximum
        if (hour === maxHour && m.value > maxMinute) return false;
        return true;
      });
    },
    [minTimeParsed, maxTimeParsed],
  );

  // Parse current value to hours and minutes
  const currentTime = useMemo(() => {
    const parsed = parseTime(displayValue) || {hour: 0, minute: 0};
    // Keep ref in sync
    latestTypedTimeRef.current = parsed;
    return parsed;
  }, [displayValue]);

  // Only show invalid state when not editing
  const showInvalid = invalid && !isEditing;

  // Apply pending selection after value changes
  useEffect(() => {
    if (pendingSelectionRef.current && inputRef.current) {
      const part = pendingSelectionRef.current;
      pendingSelectionRef.current = null;

      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (inputRef.current && document.activeElement === inputRef.current) {
          if (part === 'hour') {
            inputRef.current.setSelectionRange(0, 2);
          } else {
            inputRef.current.setSelectionRange(3, 5);
          }
        }
      });
    }
  }, [displayValue]);

  // Scroll to selected hour/minute only when dropdown first opens
  const prevOpenedRef = useRef(false);
  useEffect(() => {
    // Only scroll when transitioning from closed to open
    const justOpened = opened && !prevOpenedRef.current;
    prevOpenedRef.current = opened;

    if (!justOpened) return;

    // Scroll to the currently selected hour and minute
    const hourTimeout = setTimeout(() => {
      const hourElement = hourColumnRef.current?.querySelector(
        `[data-hour="${dropdownHour}"]`,
      ) as HTMLElement;
      if (hourElement) {
        hourElement.scrollIntoView({behavior: 'instant', block: 'center'});
      }
    }, 0);

    const minuteTimeout = setTimeout(() => {
      const minuteElement = minuteColumnRef.current?.querySelector(
        `[data-minute="${dropdownMinute}"]`,
      ) as HTMLElement;
      if (minuteElement) {
        minuteElement.scrollIntoView({behavior: 'instant', block: 'center'});
      }
    }, 0);

    return () => {
      clearTimeout(hourTimeout);
      clearTimeout(minuteTimeout);
    };
  }, [opened, dropdownHour, dropdownMinute]);

  // Helper to update value and notify parent
  const updateValue = useCallback(
    (hour: number, minute: number) => {
      const newValue = formatTime(hour, minute);
      setInternalValue(newValue);
      latestTypedTimeRef.current = {hour, minute};
      onChange?.(newValue);
    },
    [onChange],
  );

  // Helper to set selection on the input
  const setSelection = useCallback((part: SelectedPart) => {
    setSelectedPart(part);
    if (inputRef.current) {
      if (part === 'hour') {
        inputRef.current.setSelectionRange(0, 2);
      } else {
        inputRef.current.setSelectionRange(3, 5);
      }
    }
  }, []);

  // Handle input focus - always select hour part first
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      restProps.onFocus?.(e);
      typingBufferRef.current = '';
      setIsEditing(true);
      onEditingChange?.(true);
      setSelection('hour');
    },
    [restProps, setSelection, onEditingChange],
  );

  // Handle input blur
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(false);
      onEditingChange?.(false);
      typingBufferRef.current = '';
      onBlur?.(e);
    },
    [onBlur, onEditingChange],
  );

  // Handle input click - determine which part was clicked
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const clickPosition = input.selectionStart ?? 0;
      typingBufferRef.current = '';

      if (clickPosition <= 2) {
        setSelection('hour');
      } else {
        setSelection('minute');
      }
    },
    [setSelection],
  );

  // Handle keydown - this is where all the magic happens
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      restProps.onKeyDown?.(e);

      const isDigit = /^\d$/.test(e.key);

      // Handle digit input
      if (isDigit) {
        e.preventDefault();
        const digit = e.key;
        const buffer = typingBufferRef.current + digit;

        if (selectedPart === 'hour') {
          const hourNum = Number.parseInt(buffer, 10);

          if (buffer.length === 1) {
            // First digit - check if we need to auto-advance
            if (hourNum > 2) {
              // Single digit > 2 means we can only have 0X hours (03, 04, etc.)
              // Set hour and advance to minutes
              updateValue(hourNum, currentTime.minute);
              typingBufferRef.current = '';
              pendingSelectionRef.current = 'minute';
              setSelectedPart('minute');
            } else {
              // Could be 0, 1, or 2 - wait for second digit
              typingBufferRef.current = buffer;
              // Show partial value (e.g., "1_:00")
              updateValue(hourNum, currentTime.minute);
              pendingSelectionRef.current = 'hour';
            }
          } else {
            // Second digit
            const clampedHour = Math.min(23, hourNum);
            updateValue(clampedHour, currentTime.minute);
            typingBufferRef.current = '';
            pendingSelectionRef.current = 'minute';
            setSelectedPart('minute');
          }
        } else {
          // Minute part - use the latest typed hour to avoid stale state
          const minuteNum = Number.parseInt(buffer, 10);

          if (buffer.length === 1) {
            if (minuteNum > 5) {
              // Single digit > 5 means we can only have 0X minutes
              updateValue(latestTypedTimeRef.current.hour, minuteNum);
              typingBufferRef.current = '';
              pendingSelectionRef.current = 'minute';
            } else {
              // Store buffer and update with single digit
              typingBufferRef.current = buffer;
              updateValue(latestTypedTimeRef.current.hour, minuteNum);
              pendingSelectionRef.current = 'minute';
            }
          } else {
            // Second digit - use the hour from latest typed time
            const clampedMinute = Math.min(59, minuteNum);
            updateValue(latestTypedTimeRef.current.hour, clampedMinute);
            typingBufferRef.current = '';
            pendingSelectionRef.current = 'minute';
          }
        }
        return;
      }

      // Handle navigation keys
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          typingBufferRef.current = '';
          setSelection('hour');
          break;

        case 'ArrowRight':
          e.preventDefault();
          typingBufferRef.current = '';
          setSelection('minute');
          break;

        case 'ArrowUp':
          e.preventDefault();
          typingBufferRef.current = '';
          if (selectedPart === 'hour') {
            const newHour = (currentTime.hour + 1) % 24;
            updateValue(newHour, currentTime.minute);
            pendingSelectionRef.current = 'hour';
          } else {
            const newMinute = (currentTime.minute + 1) % 60;
            updateValue(currentTime.hour, newMinute);
            pendingSelectionRef.current = 'minute';
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          typingBufferRef.current = '';
          if (selectedPart === 'hour') {
            const newHour = (currentTime.hour - 1 + 24) % 24;
            updateValue(newHour, currentTime.minute);
            pendingSelectionRef.current = 'hour';
          } else {
            const newMinute = (currentTime.minute - 1 + 60) % 60;
            updateValue(currentTime.hour, newMinute);
            pendingSelectionRef.current = 'minute';
          }
          break;

        case 'Tab':
          // Allow Tab to move between hour and minute
          if (!e.shiftKey && selectedPart === 'hour') {
            e.preventDefault();
            typingBufferRef.current = '';
            setSelection('minute');
          } else if (e.shiftKey && selectedPart === 'minute') {
            e.preventDefault();
            typingBufferRef.current = '';
            setSelection('hour');
          }
          // Otherwise, let Tab navigate out of the input
          break;

        case ':':
          // Colon key moves to minute part
          e.preventDefault();
          typingBufferRef.current = '';
          setSelection('minute');
          break;

        case 'Backspace':
        case 'Delete':
          e.preventDefault();
          typingBufferRef.current = '';
          if (selectedPart === 'hour') {
            updateValue(0, currentTime.minute);
            pendingSelectionRef.current = 'hour';
          } else {
            updateValue(currentTime.hour, 0);
            pendingSelectionRef.current = 'minute';
          }
          break;

        default:
          // Prevent any other input
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
          }
          break;
      }
    },
    [restProps, selectedPart, currentTime, updateValue, setSelection],
  );

  // Prevent onChange from doing anything - we handle everything in keydown
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent default browser behavior from messing with our value
    e.preventDefault();
  }, []);

  // Handle icon button click to open dropdown
  const handleIconClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        const willOpen = !opened;
        if (willOpen) {
          // Store the current value for cancel
          originalValueRef.current = displayValue;
          setDropdownHour(currentTime.hour);
          setDropdownMinute(currentTime.minute);
        }
        setOpened(willOpen);
      }
    },
    [disabled, opened, currentTime, displayValue],
  );

  // Handle hour selection in dropdown - update value immediately
  const handleHourClick = useCallback(
    (hour: number) => {
      setDropdownHour(hour);
      // Update value immediately with new hour and current minute
      updateValue(hour, dropdownMinute);
    },
    [dropdownMinute, updateValue],
  );

  // Handle minute selection in dropdown - update value immediately
  const handleMinuteClick = useCallback(
    (minute: number) => {
      setDropdownMinute(minute);
      // Update value immediately with current hour and new minute
      updateValue(dropdownHour, minute);
    },
    [dropdownHour, updateValue],
  );

  // Handle OK button - just close, value already updated
  const handleOk = useCallback(() => {
    setOpened(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  // Handle Cancel button - revert to original value
  const handleCancel = useCallback(() => {
    // Revert to the value that was there when dropdown opened
    const originalTime = parseTime(originalValueRef.current) || {
      hour: 0,
      minute: 0,
    };
    updateValue(originalTime.hour, originalTime.minute);
    setDropdownHour(originalTime.hour);
    setDropdownMinute(originalTime.minute);
    setOpened(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [updateValue]);

  // Get filtered minutes for current dropdown hour
  const filteredMinutes = useMemo(
    () => getFilteredMinutes(dropdownHour),
    [getFilteredMinutes, dropdownHour],
  );

  return (
    <Container $fullWidth={fullWidth} className={className}>
      <InputWrapper ref={triggerRef}>
        <StyledInput
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          invalid={showInvalid}
          size={size}
          fullRounded={fullRounded}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleClick}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={5}
          inputMode="numeric"
          autoComplete="off"
          {...restProps}
        />
        <IconButtonWrapper>
          <IconButton
            variant="ghost"
            onClick={handleIconClick}
            disabled={disabled}
            aria-label="Open time picker"
            tabIndex={-1}
          >
            <ClockIcon size={16} />
          </IconButton>
        </IconButtonWrapper>
      </InputWrapper>

      <Overlay
        ref={overlayRef}
        opened={opened}
        setOpened={setOpened}
        cancelOnEscKey
        cancelOnOutsideClick
        withBackdrop
        transparentBackdrop
        triggerRef={triggerRef}
        modalCss={css`
          ${dropdownOverlayCss}
          padding: var(--spacing-2);
          min-width: 12rem;
        `}
        position={{
          fitToScreen: true,
          positionTarget: triggerRef.current,
          verticalOffset: 2,
          horizontalAlign: 'right',
          ...overlayPosition,
        }}
      >
        <TimePickerDropdown>
          <ColumnsContainer>
            <Column ref={hourColumnRef}>
              <ScrollableList>
                {filteredHours.map((hour) => (
                  <TimeOption
                    key={hour.value}
                    data-hour={hour.value}
                    $selected={dropdownHour === hour.value}
                    onClick={() => handleHourClick(hour.value)}
                  >
                    {hour.label}
                  </TimeOption>
                ))}
              </ScrollableList>
            </Column>
            <Column ref={minuteColumnRef}>
              <ScrollableList>
                {filteredMinutes.map((minute) => (
                  <TimeOption
                    key={minute.value}
                    data-minute={minute.value}
                    $selected={dropdownMinute === minute.value}
                    onClick={() => handleMinuteClick(minute.value)}
                  >
                    {minute.label}
                  </TimeOption>
                ))}
              </ScrollableList>
            </Column>
          </ColumnsContainer>
          <ActionsContainer>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="w-full" elevated>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleOk} className="w-full">
              OK
            </Button>
          </ActionsContainer>
        </TimePickerDropdown>
      </Overlay>
    </Container>
  );
}

const Container = styled.div<{$fullWidth: boolean}>`
  position: relative;
  width: ${({$fullWidth}) => ($fullWidth ? '100%' : 'auto')};
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
`;

const StyledInput = styled(Input)`
  width: 100%;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;

  /* Ensure padding for the icon */
  && {
    padding-right: 2.5rem;
  }
`;

const IconButtonWrapper = styled.div`
  position: absolute;
  right: var(--spacing-1);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: auto;
`;

const TimePickerDropdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const ColumnsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
  max-height: 20rem;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ScrollableList = styled.div`
  ${scrollBarCss}
  max-height: 18rem;
  overflow-y: auto;
  padding: var(--spacing-1);
`;

const TimeOption = styled.div<{$selected: boolean}>`
  align-items: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  font-size: var(--text-sm);
  justify-content: center;
  min-height: 2rem;
  padding: var(--spacing-1) var(--spacing-2);
  transition: background-color 0.15s ease;
  user-select: none;

  ${({$selected}) =>
    $selected
      ? css`
          background-color: var(--bg-deep);
          color: var(--fg-body);
          font-weight: var(--font-weight-bold);
        `
      : css`
          &:hover {
            background-color: var(--bg-subtle);
          }
        `}
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  padding-top: var(--spacing-2);
`;
