import {ChevronDownIcon} from 'lucide-react';
import {useMemo, useRef, useState} from 'react';
import type {DayPickerProps} from 'react-day-picker';
import type {DateTime} from 'luxon';
import styled, {css} from 'styled-components';
import {dropdownOverlayCss} from '../../style';
import {Button} from '../button';
import type {ButtonProps} from '../button';
import {DatePicker} from '../date-picker/DatePicker';
import type {SharedProps as DatePickerSharedProps} from '../date-picker/DatePicker';
import {Overlay} from '../overlay/Overlay';
import type {OverlayProps} from '../overlay/Overlay';

// Define the value and onChange types using Luxon DateTime objects
export type SingleDateValue = DateTime | undefined;

const DEFAULT_BUTTON_PROPS: Pick<ButtonProps, 'size' | 'variant'> = {
  size: 'md',
  variant: 'outline',
};

// Props for DatePickerInput when mode is 'single'
interface SingleDatePickerInputProps {
  buttonProps?: Partial<Pick<ButtonProps, 'size' | 'variant' | 'fullRounded' | 'autoHeight'>>;
  datePickerProps?: Partial<
    Omit<DayPickerProps, 'mode' | 'selected' | 'onSelect' | 'onChange' | 'timeZone'>
  >;
  disabled?: boolean;
  displayFormat?: string | ((date: SingleDateValue) => string);
  onChange?: (date: SingleDateValue) => void;
  overlayPosition?: OverlayProps['position'];
  placeholder?: string;
  timezone?: string;
  value?: SingleDateValue;
  fullWidth?: boolean;
  /**
   * When true, clicking the same selected day will keep it selected and close the overlay.
   * When false, clicking the same selected day will unselect it (default react-day-picker behavior).
   * @default true
   */
  keepSelectedOnSameDayClick?: boolean;
  /**
   * Day of the week the calendar should start on.
   * 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
   * @default 0 (Sunday, US standard)
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function SingleDatePickerInput(props: SingleDatePickerInputProps) {
  const {
    buttonProps,
    datePickerProps,
    disabled,
    displayFormat,
    onChange,
    overlayPosition,
    placeholder = 'Select date',
    timezone,
    value,
    fullWidth = false,
    keepSelectedOnSameDayClick = true,
    weekStartsOn = 0, // Default to Sunday (US standard)
  } = props;

  const [opened, setOpened] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  const handleDatePickerChange = (datePickerOutput: SingleDateValue) => {
    // If keepSelectedOnSameDayClick is true and we're clicking the same day that's already selected,
    // don't call onChange but still close the overlay
    if (keepSelectedOnSameDayClick && datePickerOutput === undefined && value !== undefined) {
      setOpened(false);
      return;
    }

    onChange?.(datePickerOutput);
    setOpened(false);
  };

  const onTriggerClick = () => {
    if (!disabled) {
      setOpened((prev) => !prev);
    }
  };

  const formattedValue = useMemo(() => {
    if (!value) return placeholder;
    if (typeof displayFormat === 'function') {
      return displayFormat(value);
    }
    // Default format: 'LLL d, yyyy' (e.g., "Nov 3, 2024")
    // If user provides dayjs-style format, it should still work with Luxon
    const formatStr = displayFormat || 'LLL d, yyyy';
    return value.toFormat(formatStr);
  }, [value, placeholder, displayFormat]);

  const datePickerSelectedValue = useMemo(() => {
    if (!value) return undefined;
    // Adjust to noon in the object's own timezone before converting to JS Date
    return value.set({hour: 12, minute: 0, second: 0, millisecond: 0}).toJSDate();
  }, [value]);

  return (
    <>
      <StyledButton
        ref={triggerRef as any}
        onClick={onTriggerClick}
        disabled={disabled}
        $fullWidth={fullWidth}
        {...DEFAULT_BUTTON_PROPS}
        {...buttonProps}
      >
        {formattedValue}
        <ChevronDownIcon size={14} className="fg-muted shrink-0 ml-1" strokeWidth={2} />
      </StyledButton>
      {opened && (
        <Overlay
          triggerRef={triggerRef}
          opened={opened}
          setOpened={setOpened}
          position={{
            fitToScreen: true,
            horizontalAlign: 'left',
            verticalAlign: 'top',
            noVerticalOverlap: true,
            mode: 'absolute',
            verticalOffset: 6,
            positionTarget: triggerRef.current,
            ...overlayPosition,
          }}
          cancelOnOutsideClick
          cancelOnEscKey
          modalCss={css`
            ${dropdownOverlayCss}
            padding: var(--spacing-4);
          `}
        >
          <DatePicker
            mode="single"
            selected={datePickerSelectedValue}
            onChange={handleDatePickerChange as DatePickerSharedProps['onChange']}
            defaultMonth={datePickerSelectedValue}
            timezone={timezone}
            weekStartsOn={weekStartsOn}
            {...(datePickerProps as any)}
          />
        </Overlay>
      )}
    </>
  );
}

const StyledButton = styled(Button)<{$fullWidth: boolean}>`
  ${({$fullWidth}) =>
    $fullWidth &&
    css`
      width: 100%;
      justify-content: space-between;
    `}
`;
