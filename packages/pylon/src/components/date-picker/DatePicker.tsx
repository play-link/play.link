import type {DateRange, DayPickerProps} from 'react-day-picker';
import {DayPicker} from 'react-day-picker';
import {DateTime} from 'luxon';
import {styled} from 'styled-components';

type OtherDayPickerProps = Omit<
  DayPickerProps,
  | 'mode'
  | 'selected'
  | 'onSelect'
  | 'numberOfMonths'
  | 'timeZone'
  | 'showOutsideDays'
  | 'ISOWeek'
  | 'className'
>;

export interface SharedProps extends OtherDayPickerProps {
  onChange: (date: DateTime | {from: DateTime; to?: DateTime} | undefined) => void;
  timezone?: string;
  numberOfMonths?: number;
  /**
   * Day of the week the calendar should start on.
   * 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
   * @default 0 (Sunday, US standard)
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

interface DatePickerSingleProps extends SharedProps {
  mode: 'single';
  selected?: Date;
}

interface DatePickerRangeProps extends SharedProps {
  mode: 'range';
  selected?: DateRange;
}

export type Props = DatePickerSingleProps | DatePickerRangeProps;

export function DatePicker(props: Props) {
  const _timezone = props.timezone || 'UTC';
  const _weekStartsOn = props.weekStartsOn ?? 0; // Default to Sunday (US standard)
  if (props.mode === 'single') {
    const {selected, numberOfMonths, onChange, mode: _mode, weekStartsOn, ...rest} = props;

    const handleSelectSingle = (
      jsDate: Date | undefined,
      _selectedDay: Date,
      _activeModifiers: Record<string, boolean>,
      _e: React.MouseEvent | React.KeyboardEvent,
    ) => {
      if (!jsDate) {
        onChange(undefined);
        return;
      }
      onChange(DateTime.fromJSDate(jsDate, {zone: _timezone}).startOf('day'));
    };

    return (
      <Root>
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelectSingle}
          timeZone={_timezone}
          numberOfMonths={numberOfMonths}
          showOutsideDays={(numberOfMonths ?? 1) <= 1}
          ISOWeek
          weekStartsOn={_weekStartsOn}
          className="rdp-custom"
          {...rest}
        />
      </Root>
    );
  }

  const {selected, numberOfMonths, onChange, mode: _mode, weekStartsOn, ...rest} = props;

  const handleSelectRange = (
    _range: DateRange | undefined,
    day: Date,
    _activeModifiers: Record<string, boolean>,
    _e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    const luxonDate = DateTime.fromJSDate(day, {zone: _timezone}).startOf('day');

    if (!selected?.from || (selected.from && selected.to)) {
      onChange({
        from: luxonDate,
        to: undefined,
      });
      return;
    }

    if (selected.from && !selected.to) {
      const from = DateTime.isDateTime(selected.from)
        ? selected.from
        : DateTime.fromJSDate(selected.from, {zone: _timezone});
      const to = luxonDate;

      if (to.valueOf() < from.valueOf()) {
        onChange({from: to, to: from});
      } else {
        onChange({from, to});
      }
    }
  };

  return (
    <Root>
      <DayPicker
        mode="range"
        selected={
          selected
            ? {
                from: selected.from
                  ? DateTime.isDateTime(selected.from)
                    ? selected.from.toJSDate()
                    : DateTime.fromJSDate(selected.from).toJSDate()
                  : undefined,
                to: selected.to
                  ? DateTime.isDateTime(selected.to)
                    ? selected.to.toJSDate()
                    : DateTime.fromJSDate(selected.to).toJSDate()
                  : undefined,
              }
            : undefined
        }
        onSelect={handleSelectRange}
        timeZone={_timezone}
        numberOfMonths={numberOfMonths}
        showOutsideDays={(numberOfMonths ?? 1) <= 1}
        weekStartsOn={_weekStartsOn}
        className="rdp-custom"
        {...rest}
      />
    </Root>
  );
}

const Root = styled.div`
  .rdp-root {
    --rdp-accent-color: var(--fg); /* The accent color used for selected days and UI elements. */
    --rdp-accent-background-color: var(
      --bg-press
    ); /* The accent background color used for selected days and UI elements. */

    --rdp-day-height: 2.25rem; /* The height of the day cells. */
    --rdp-day-width: 2.25rem; /* The width of the day cells. */

    --rdp-day_button-border-radius: 100%; /* The border radius of the day cells. */
    --rdp-day_button-border: 2px solid transparent; /* The border of the day cells. */
    --rdp-day_button-height: 2.25rem; /* The height of the day cells. */
    --rdp-day_button-width: 2.25rem; /* The width of the day cells. */

    --rdp-selected-border: 2px solid var(--rdp-accent-color); /* The border of the selected days. */
    --rdp-disabled-opacity: 0.5; /* The opacity of the disabled days. */
    --rdp-outside-opacity: 0.45; /* The opacity of the days outside the current month. */
    --rdp-today-color: var(--rdp-accent-color); /* The color of the today's date. */

    --rdp-dropdown-gap: 0.5rem; /* The gap between the dropdowns used in the month captons. */
    --rdp-months-gap: var(--spacing-7); /* The gap between the months in the multi-month view. */

    --rdp-nav_button-disabled-opacity: 0.5; /* The opacity of the disabled navigation buttons. */
    --rdp-nav_button-height: 1.75rem; /* The height of the navigation buttons. */
    --rdp-nav_button-width: 1.75rem; /* The width of the navigation buttons. */
    --rdp-nav-height: 1.75rem; /* The height of the navigation bar. */

    --rdp-range_middle-background-color: var(
      --rdp-accent-background-color
    ); /* The color of the background for days in the middle of a range. */
    --rdp-range_middle-color: inherit; /* The color of the range text. */

    --rdp-range_start-color: var(--bg); /* The color of the range text. */
    --rdp-range_start-background: linear-gradient(
      var(--rdp-gradient-direction),
      transparent 50%,
      var(--rdp-range_middle-background-color) 50%
    ); /* Used for the background of the start of the selected range. */
    --rdp-range_start-date-background-color: var(
      --rdp-accent-color
    ); /* The background color of the date when at the start of the selected range. */

    --rdp-range_end-background: linear-gradient(
      var(--rdp-gradient-direction),
      var(--rdp-range_middle-background-color) 50%,
      transparent 50%
    ); /* Used for the background of the end of the selected range. */
    --rdp-range_end-color: white; /* The color of the range text. */
    --rdp-range_end-date-background-color: var(
      --rdp-accent-color
    ); /* The background color of the date when at the end of the selected range. */

    --rdp-week_number-border-radius: 100%; /* The border radius of the week number. */
    --rdp-week_number-border: 2px solid transparent; /* The border of the week number. */

    --rdp-week_number-height: var(--rdp-day-height); /* The height of the week number cells. */
    --rdp-week_number-opacity: 0.75; /* The opacity of the week number. */
    --rdp-week_number-width: var(--rdp-day-width); /* The width of the week number cells. */
    --rdp-weeknumber-text-align: center; /* The text alignment of the weekday cells. */

    --rdp-gradient-direction: 90deg;

    --rdp-animation_duration: 0.3s;
    --rdp-animation_timing: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .rdp-root[dir='rtl'] {
    --rdp-gradient-direction: -90deg;
  }

  .rdp-root[data-broadcast-calendar='true'] {
    --rdp-outside-opacity: unset;
  }

  /* Root of the component. */
  .rdp-root {
    position: relative; /* Required to position the navigation toolbar. */
    box-sizing: border-box;
  }

  .rdp-root * {
    box-sizing: border-box;
  }

  .rdp-day {
    width: var(--rdp-day-width);
    height: var(--rdp-day-height);
    text-align: center;
    position: relative;

    &:hover :after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 1px solid var(--fg);
      border-radius: var(--rdp-day_button-border-radius);
    }
  }

  .rdp-day_button {
    background: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font: inherit;
    color: inherit;
    justify-content: center;
    align-items: center;
    display: flex;

    width: var(--rdp-day_button-width);
    height: var(--rdp-day_button-height);
    border: var(--rdp-day_button-border);
    border-radius: var(--rdp-day_button-border-radius);
  }

  .rdp-day_button:disabled {
    cursor: revert;
  }

  .rdp-caption_label {
    z-index: 1;

    position: relative;
    display: inline-flex;

    white-space: nowrap;
    border: 0;
  }

  .rdp-dropdown:focus-visible ~ .rdp-caption_label {
    outline: 5px auto Highlight;
    outline: 5px auto -webkit-focus-ring-color;
  }

  .rdp-button_next,
  .rdp-button_previous {
    border: none;
    background: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font: inherit;
    -moz-appearance: none;
    -webkit-appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    appearance: none;

    width: var(--rdp-nav_button-width);
    height: var(--rdp-nav_button-height);
    border-radius: var(--radius-lg);

    margin-top: -0.375rem;

    svg {
      fill: var(--fg-subtle);
      width: 1.125rem;
      height: 1.125rem;
    }

    &:hover {
      background: var(--bg-hover);
    }
  }

  .rdp-button_next:disabled,
  .rdp-button_next[aria-disabled='true'],
  .rdp-button_previous:disabled,
  .rdp-button_previous[aria-disabled='true'] {
    cursor: revert;

    opacity: var(--rdp-nav_button-disabled-opacity);
  }

  .rdp-chevron {
    display: inline-block;
    fill: var(--rdp-accent-color);
  }

  .rdp-root[dir='rtl'] .rdp-nav .rdp-chevron {
    transform: rotate(180deg);
    transform-origin: 50%;
  }

  .rdp-dropdowns {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--rdp-dropdown-gap);
  }
  .rdp-dropdown {
    z-index: 2;

    /* Reset */
    opacity: 0;
    appearance: none;
    position: absolute;
    inset-block-start: 0;
    inset-block-end: 0;
    inset-inline-start: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    cursor: inherit;
    border: none;
    line-height: inherit;
  }

  .rdp-dropdown_root {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .rdp-dropdown_root[data-disabled='true'] .rdp-chevron {
    opacity: var(--rdp-disabled-opacity);
  }

  .rdp-month_caption {
    align-content: center;
    display: flex;
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    height: var(--rdp-nav-height);
  }

  .rdp-root[data-nav-layout='around'] .rdp-month,
  .rdp-root[data-nav-layout='after'] .rdp-month {
    position: relative;
  }

  .rdp-root[data-nav-layout='around'] .rdp-month_caption {
    justify-content: center;
    margin-inline-start: var(--rdp-nav_button-width);
    margin-inline-end: var(--rdp-nav_button-width);
    position: relative;
  }

  .rdp-root[data-nav-layout='around'] .rdp-button_previous {
    position: absolute;
    inset-inline-start: 0;
    top: 0;
    height: var(--rdp-nav-height);
    display: inline-flex;
  }

  .rdp-root[data-nav-layout='around'] .rdp-button_next {
    position: absolute;
    inset-inline-end: 0;
    top: 0;
    height: var(--rdp-nav-height);
    display: inline-flex;
    justify-content: center;
  }

  .rdp-months {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: var(--rdp-months-gap);
    max-width: fit-content;
  }

  .rdp-month_grid {
    border-collapse: collapse;
  }

  .rdp-nav {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;

    display: flex;
    align-items: center;

    height: var(--rdp-nav-height);
  }

  .rdp-weekday {
    color: var(--fg-subtle);
    font-size: var(--text-xxs);
    font-weight: var(--font-weight-medium);
    padding: var(--spacing-3) 0 var(--spacing-2);
    text-align: center;
    text-transform: uppercase;
  }

  .rdp-week_number {
    border-radius: var(--rdp-week_number-border-radius);
    border: var(--rdp-week_number-border);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-normal);
    height: var(--rdp-week_number-height);
    opacity: var(--rdp-week_number-opacity);
    text-align: var(--rdp-weeknumber-text-align);
    width: var(--rdp-week_number-width);
  }

  /* DAY MODIFIERS */
  .rdp-today:not(.rdp-outside) {
    color: var(--rdp-today-color);
  }

  .rdp-selected {
    font-weight: var(--font-weight-semibold);
  }

  .rdp-selected:not(.rdp-range_start):not(.rdp-range_end):not(.rdp-range_middle) button {
    background-color: var(--rdp-range_start-date-background-color);
    color: var(--rdp-range_start-color);
  }

  .rdp-selected .rdp-day_button {
    border: var(--rdp-selected-border);
  }

  .rdp-outside {
    color: var(--fg-disabled);
  }

  .rdp-disabled {
    opacity: var(--rdp-disabled-opacity);
  }

  .rdp-hidden {
    visibility: hidden;
    color: var(--rdp-range_start-color);
  }

  .rdp-range_start {
    background: var(--rdp-range_start-background);
  }

  .rdp-range_start .rdp-day_button {
    background-color: var(--rdp-range_start-date-background-color);
    color: var(--rdp-range_start-color);
  }

  .rdp-range_middle {
    background-color: var(--rdp-range_middle-background-color);
  }

  .rdp-range_middle .rdp-day_button {
    border-color: transparent;
    border: unset;
    border-radius: unset;
    color: var(--rdp-range_middle-color);
  }

  .rdp-range_end {
    background: var(--rdp-range_end-background);
    color: var(--rdp-range_end-color);
  }

  .rdp-range_end .rdp-day_button {
    color: var(--rdp-range_start-color);
    background-color: var(--rdp-range_end-date-background-color);
  }

  .rdp-range_start.rdp-range_end {
    background: revert;
  }

  .rdp-focusable {
    cursor: pointer;
  }

  @keyframes rdp-slide_in_left {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes rdp-slide_in_right {
    0% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes rdp-slide_out_left {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-100%);
    }
  }

  @keyframes rdp-slide_out_right {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .rdp-weeks_before_enter {
    animation: rdp-slide_in_left var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  .rdp-weeks_before_exit {
    animation: rdp-slide_out_left var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  .rdp-weeks_after_enter {
    animation: rdp-slide_in_right var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  .rdp-weeks_after_exit {
    animation: rdp-slide_out_right var(--rdp-animation_duration) var(--rdp-animation_timing)
      forwards;
  }

  .rdp-root[dir='rtl'] .rdp-weeks_after_enter {
    animation: rdp-slide_in_left var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  .rdp-root[dir='rtl'] .rdp-weeks_before_exit {
    animation: rdp-slide_out_right var(--rdp-animation_duration) var(--rdp-animation_timing)
      forwards;
  }

  .rdp-root[dir='rtl'] .rdp-weeks_before_enter {
    animation: rdp-slide_in_right var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  .rdp-root[dir='rtl'] .rdp-weeks_after_exit {
    animation: rdp-slide_out_left var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  @keyframes rdp-fade_in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes rdp-fade_out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .rdp-caption_after_enter {
    animation: rdp-fade_in var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  .rdp-caption_after_exit {
    animation: rdp-fade_out var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  .rdp-caption_before_enter {
    animation: rdp-fade_in var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }

  .rdp-caption_before_exit {
    animation: rdp-fade_out var(--rdp-animation_duration) var(--rdp-animation_timing) forwards;
  }
`;
