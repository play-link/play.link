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

      <FieldsetController
        control={control}
        name="slug"
        rules={{
          required: 'Slug is required',
          maxLength: {value: 100, message: 'Max 100 characters'},
          pattern: {
            value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            message: 'Lowercase letters, numbers, and hyphens only',
          },
        }}
        fieldsetProps={{label: 'Slug', helpText: 'play.link/your-slug'}}
        render={({controlledProps}) => (
          <Input
            {...controlledProps}
            placeholder="my-game"
            disabled={disabled}
            className="w-full"
          />
        )}
      />
    </Section>
  );
}
