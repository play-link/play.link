import {useFormContext} from 'react-hook-form';
import {FieldsetController, Input} from '@play/pylon';
import {Section, SectionTitle} from './shared';
import type {GameSettingsFormValues, SectionProps} from './types';

export function IdentitySection({disabled}: SectionProps) {
  const {control} = useFormContext<GameSettingsFormValues>();

  return (
    <Section>
      <SectionTitle>Identity</SectionTitle>

      <FieldsetController
        control={control}
        name="title"
        rules={{
          required: 'Title is required',
          maxLength: {value: 200, message: 'Max 200 characters'},
        }}
        fieldsetProps={{label: 'Title'}}
        render={({controlledProps}) => (
          <Input
            {...controlledProps}
            placeholder="Game title"
            disabled={disabled}
            className="w-full"
          />
        )}
      />

    </Section>
  );
}
