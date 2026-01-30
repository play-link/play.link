import {useFormContext} from 'react-hook-form';
import {DateTime} from 'luxon';
import {FieldsetController, Select, SingleDatePickerInput} from '@play/pylon';
import type {SingleDateValue} from '@play/pylon';
import {Section, SectionTitle} from './shared';
import type {GameSettingsFormValues, SectionProps} from './types';

const STATUS_OPTIONS = [
  {label: 'In Development', value: 'IN_DEVELOPMENT'},
  {label: 'Upcoming', value: 'UPCOMING'},
  {label: 'Early Access', value: 'EARLY_ACCESS'},
  {label: 'Released', value: 'RELEASED'},
  {label: 'Cancelled', value: 'CANCELLED'},
];

function stringToDateTime(value: string): SingleDateValue {
  if (!value) return undefined;
  const dt = DateTime.fromISO(value);
  return dt.isValid ? dt : undefined;
}

function dateTimeToString(value: SingleDateValue): string {
  if (!value) return '';
  return value.toISODate() ?? '';
}

export function StatusReleaseSection({disabled}: SectionProps) {
  const {control} = useFormContext<GameSettingsFormValues>();

  return (
    <Section>
      <SectionTitle>Status & Release</SectionTitle>

      <FieldsetController
        control={control}
        name="status"
        fieldsetProps={{label: 'Status'}}
        render={({controlledProps}) => (
          <Select
            options={STATUS_OPTIONS}
            value={controlledProps.value}
            onChange={(e) => controlledProps.onChange(e.target.value)}
            disabled={disabled}
          />
        )}
      />

      <FieldsetController
        control={control}
        name="releaseDate"
        fieldsetProps={{label: 'Release date'}}
        render={({controlledProps}) => (
          <SingleDatePickerInput
            value={stringToDateTime(controlledProps.value)}
            onChange={(date) =>
              controlledProps.onChange(dateTimeToString(date))
            }
            placeholder="Select release date"
            disabled={disabled}
            fullWidth
          />
        )}
      />
    </Section>
  );
}
