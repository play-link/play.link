import * as React from 'react';
import {useState} from 'react';
import type {DateRange} from 'react-day-picker';
import {DateTime} from 'luxon';
import {DatePicker} from '../../src/components/date-picker/DatePicker';
import {RangeDatePickerInput} from '../../src/components/date-picker/RangeDatePickerInput';
import type {RangeDateValue} from '../../src/components/date-picker/RangeDatePickerInput';
import {SingleDatePickerInput} from '../../src/components/date-picker/SingleDatePickerInput';
import type {SingleDateValue} from '../../src/components/date-picker/SingleDatePickerInput';
import {ProvidersDecorator} from '../Providers';

const meta = {
  title: 'Components/DatePicker',
  decorators: [ProvidersDecorator],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

// DatePicker Examples
const DatePickerSingleExample: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    DateTime.now().plus({days: 1}).toJSDate(),
  );

  const handleChange = (date: DateTime | {from: DateTime; to?: DateTime} | undefined) => {
    if (date && !('from' in date)) {
      setSelectedDate(date.toJSDate());
    } else {
      setSelectedDate(undefined);
    }
  };

  return (
    <DatePicker
      mode="single"
      selected={selectedDate}
      onChange={handleChange}
      timezone="America/New_York"
    />
  );
};

const DatePickerRangeExample: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: DateTime.now().minus({days: 2}).toJSDate(),
    to: DateTime.now().plus({days: 3}).toJSDate(),
  });

  const handleChange = (date: DateTime | {from: DateTime; to?: DateTime} | undefined) => {
    if (date && 'from' in date) {
      setSelectedRange({
        from: date.from.toJSDate(),
        to: date.to?.toJSDate(),
      });
    } else {
      setSelectedRange(undefined);
    }
  };

  return (
    <DatePicker
      mode="range"
      selected={selectedRange}
      onChange={handleChange}
      timezone="America/New_York"
    />
  );
};

// SingleDatePickerInput Example
const SingleDatePickerInputExample: React.FC = () => {
  const [value, setValue] = useState<SingleDateValue>(DateTime.now().plus({days: 1}));

  return (
    <SingleDatePickerInput
      value={value}
      onChange={setValue}
      timezone="America/New_York"
      placeholder="Select a date"
    />
  );
};

// RangeDatePickerInput Example
const RangeDatePickerInputExample: React.FC = () => {
  const [value, setValue] = useState<RangeDateValue>({
    from: DateTime.now().minus({days: 2}),
    to: DateTime.now().plus({days: 3}),
  });

  return (
    <RangeDatePickerInput
      value={value}
      onChange={setValue}
      timezone="America/New_York"
      placeholder="Select date range"
      cancellable
      labelledDates={[
        'today',
        'yesterday',
        'this-week',
        'last-7-days',
        'last-week',
        'this-month',
        'this-year',
        'next-7-days',
        'next-week',
        'next-month',
        'this-year',
      ]}
    />
  );
};

export const DatePickerSingle = {
  render: () => <DatePickerSingleExample />,
};

export const DatePickerRange = {
  render: () => <DatePickerRangeExample />,
};

export const SingleDatePickerInputStory = {
  render: () => <SingleDatePickerInputExample />,
};

export const RangeDatePickerInputStory = {
  render: () => <RangeDatePickerInputExample />,
};
