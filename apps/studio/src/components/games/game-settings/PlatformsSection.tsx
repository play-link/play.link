import {useFormContext} from 'react-hook-form';
import {FieldsetController, Select} from '@play/pylon';
import {Section, SectionTitle} from './shared';
import type {GameSettingsFormValues, SectionProps} from './types';

const PLATFORM_OPTIONS = [
  {label: 'PC', value: 'PC'},
  {label: 'Mac', value: 'Mac'},
  {label: 'Linux', value: 'Linux'},
  {label: 'PS5', value: 'PS5'},
  {label: 'Xbox Series', value: 'Xbox Series'},
  {label: 'Switch', value: 'Switch'},
  {label: 'iOS', value: 'iOS'},
  {label: 'Android', value: 'Android'},
];

export function PlatformsSection({disabled}: SectionProps) {
  const {control} = useFormContext<GameSettingsFormValues>();

  return (
    <Section>
      <SectionTitle>Platforms</SectionTitle>

      <FieldsetController
        control={control}
        name="platforms"
        fieldsetProps={{label: 'Platforms'}}
        render={({controlledProps}) => (
          <Select
            options={PLATFORM_OPTIONS}
            value={controlledProps.value || []}
            onChange={(e) => controlledProps.onChange(e.target.value)}
            multiple
            placeholder="Select platforms..."
            disabled={disabled}
          />
        )}
      />
    </Section>
  );
}
