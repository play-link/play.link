import {ChevronDownIcon} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import type {DateRange as DayPickerDateRange} from 'react-day-picker';
import {DateTime} from 'luxon';
import {css} from 'styled-components';
import {useIsSmallScreen} from '../../lib';
import {dropdownOverlayCss} from '../../style';
import {toClassName} from '../../style/css-helpers';
import {Button} from '../button';
import type {ButtonProps} from '../button';
import {DatePicker} from '../date-picker';
import type {Props as DatePickerProps, SharedProps as DatePickerSharedProps} from '../date-picker';
import {Icon} from '../icon';
import {ClearIconButton} from '../icon-button';
import {Overlay} from '../overlay';
import type {OverlayProps} from '../overlay';
import {getLabelledDatesOptions} from './labelled-dates';
import type {LabelledDatesOption} from './labelled-dates';

export type RangeDateValue = {from: DateTime; to?: DateTime} | undefined;

const DEFAULT_BUTTON_PROPS: Pick<ButtonProps, 'size' | 'variant'> = {
  size: 'md',
  variant: 'outline',
};

interface Props {
  buttonProps?: Partial<Pick<ButtonProps, 'size' | 'variant' | 'fullRounded' | 'autoHeight'>>;
  cancellable?: boolean;
  labelledDates?: LabelledDatesOption[];
  datePickerProps?: Partial<Omit<DatePickerProps, 'mode' | 'selected' | 'onChange' | 'timezone'>>;
  defaultValue?: RangeDateValue;
  disabled?: boolean;
  displayFormat?: (dateRange: NonNullable<RangeDateValue>) => string;
  onChange?: (dateRange: RangeDateValue) => void;
  overlayProps?: Partial<Omit<OverlayProps, 'opened' | 'setOpened' | 'triggerRef'>>;
  placeholder?: string;
  timezone?: string;
  value?: RangeDateValue;
  valuePrefix?: string;
  /**
   * Day of the week the calendar should start on.
   * 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
   * @default 0 (Sunday, US standard)
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function RangeDatePickerInput(props: Props) {
  const {
    buttonProps,
    cancellable = false,
    datePickerProps,
    defaultValue,
    disabled,
    displayFormat,
    labelledDates,
    onChange,
    overlayProps,
    placeholder = 'Select date range',
    timezone,
    value,
    valuePrefix,
    weekStartsOn = 0, // Default to Sunday (US standard)
  } = props;

  const isSmallScreen = useIsSmallScreen();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [tempRangeValue, setTempRangeValue] = useState<RangeDateValue>(value);
  const [displayedMonth, setDisplayedMonth] = useState<DateTime | undefined>(value?.from);
  const [initialValueOnOpen, setInitialValueOnOpen] = useState<RangeDateValue>(undefined);
  const triggerRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const now = useMemo(() => DateTime.now().setZone(timezone || 'UTC'), [timezone]);

  const availableLabelledDates = useMemo(() => {
    if (!labelledDates) {
      return [];
    }
    const options = getLabelledDatesOptions(now, weekStartsOn);
    return options
      .filter((option) => labelledDates.includes(option.key))
      .sort((a, b) => labelledDates.indexOf(a.key) - labelledDates.indexOf(b.key));
  }, [labelledDates, now, weekStartsOn]);

  const areRangesEqual = (a: RangeDateValue, b: RangeDateValue): boolean => {
    const aFrom = a?.from?.toFormat('yyyy-MM-dd');
    const aTo = a?.to?.toFormat('yyyy-MM-dd');
    const bFrom = b?.from?.toFormat('yyyy-MM-dd');
    const bTo = b?.to?.toFormat('yyyy-MM-dd');
    return aFrom === bFrom && aTo === bTo;
  };

  const showCancelButton = cancellable && !areRangesEqual(value, defaultValue);

  const handleResetToDefault = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange?.(defaultValue);
    setTempRangeValue(defaultValue);
    setIsOverlayOpen(false);
  };

  const handleResetKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleResetToDefault(e);
    }
  };

  const handleDatePickerChange = (datePickerOutput: RangeDateValue) => {
    setTempRangeValue(datePickerOutput);

    if (datePickerOutput?.from && datePickerOutput.to) {
      onChange?.(datePickerOutput);
    }
  };

  const handleLabelledDateClick = (range: RangeDateValue) => {
    setTempRangeValue(range);
    setDisplayedMonth(range?.to || range?.from);
    if (range?.from && range.to) {
      onChange?.(range);
      setIsOverlayOpen(false);
    }
  };

  const handleOverlayOpen = () => {
    if (!disabled) {
      setInitialValueOnOpen(value);
      setTempRangeValue(value);
      setIsOverlayOpen(true);
      if (value?.from) {
        setDisplayedMonth(value.from);
      }
    }
  };

  useEffect(() => {
    if (!isOverlayOpen) {
      if (tempRangeValue?.from && !tempRangeValue?.to) {
        onChange?.(initialValueOnOpen);
      }
    }
  }, [isOverlayOpen, tempRangeValue, initialValueOnOpen, onChange]);

  const formattedValue = useMemo(() => {
    if (!value?.from) {
      return placeholder;
    }

    let dateDisplayString: string;

    const matchingLabelledDate = availableLabelledDates.find((labelledOption) =>
      areRangesEqual(value, {
        from: labelledOption.from,
        to: labelledOption.to,
      }),
    );

    if (matchingLabelledDate) {
      dateDisplayString = matchingLabelledDate.label;
    } else if (typeof displayFormat === 'function') {
      dateDisplayString = displayFormat(value as NonNullable<RangeDateValue>);
    } else {
      const fromFormatted = value.from.toFormat('MM/dd/yy');
      const toFormatted = value.to ? value.to.toFormat('MM/dd/yy') : '...';
      dateDisplayString = `${fromFormatted} - ${toFormatted}`;
    }

    if (valuePrefix) {
      return `${valuePrefix} ${dateDisplayString}`;
    }

    return dateDisplayString;
  }, [value, placeholder, displayFormat, availableLabelledDates, valuePrefix]);

  const datePickerSelectedValue = useMemo(() => {
    const currentValue = tempRangeValue;
    if (!currentValue?.from) return undefined;
    // Adjust to noon in the object's own timezone before converting to JS Date
    return {
      from: currentValue.from.set({hour: 12, minute: 0, second: 0, millisecond: 0}).toJSDate(),
      to: currentValue.to?.set({hour: 12, minute: 0, second: 0, millisecond: 0}).toJSDate(),
    } as DayPickerDateRange;
  }, [tempRangeValue]);

  const displayLabelledDates = !isSmallScreen && availableLabelledDates.length > 0;

  return (
    <>
      <Button
        ref={triggerRef as any}
        onClick={handleOverlayOpen}
        disabled={disabled}
        {...DEFAULT_BUTTON_PROPS}
        {...buttonProps}
      >
        <span className="font-normal">{formattedValue}</span>
        {showCancelButton && (
          <ClearIconButton
            onKeyDown={handleResetKeyDown as any}
            onMouseDown={handleResetToDefault}
            className="ml-2"
          />
        )}
        <Icon icon={ChevronDownIcon} size={14} className="fg-muted shrink-0 ml-1" strokeWidth={2} />
      </Button>
      <Overlay
        opened={isOverlayOpen}
        setOpened={setIsOverlayOpen}
        cancelOnOutsideClick
        cancelOnEscKey
        withBackdrop
        transparentBackdrop
        modalCss={css`
          ${dropdownOverlayCss}
          padding: var(--spacing-3);
          ${displayLabelledDates &&
          css`
            display: flex;
            gap: var(--spacing-7);
          `}
        `}
        {...overlayProps}
        position={{
          flip: true,
          horizontalAlign: 'center',
          mode: 'absolute',
          fitToScreen: true,
          positionTarget: triggerRef.current,
          verticalOffset: 4,
          ...overlayProps?.position,
        }}
      >
        {displayLabelledDates && (
          <div className="flex flex-col gap-0.5">
            {availableLabelledDates.map((labelledOption) => {
              const isActive = areRangesEqual(tempRangeValue, {
                from: labelledOption.from,
                to: labelledOption.to,
              });
              return (
                <Button
                  key={labelledOption.key}
                  variant="nav"
                  size="sm"
                  className={toClassName({active: isActive})}
                  onClick={() =>
                    handleLabelledDateClick({
                      from: labelledOption.from,
                      to: labelledOption.to,
                    })
                  }
                >
                  {labelledOption.label}
                </Button>
              );
            })}
          </div>
        )}
        <DatePicker
          month={displayedMonth?.toJSDate()}
          onMonthChange={(month) => setDisplayedMonth(DateTime.fromJSDate(month))}
          mode="range"
          selected={datePickerSelectedValue}
          onChange={handleDatePickerChange as DatePickerSharedProps['onChange']}
          timezone={timezone}
          numberOfMonths={isSmallScreen ? 1 : 2}
          defaultMonth={datePickerSelectedValue?.from}
          weekStartsOn={weekStartsOn}
          {...datePickerProps}
        />
      </Overlay>
    </>
  );
}
