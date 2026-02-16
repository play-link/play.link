import {useFormContext} from 'react-hook-form';
import {FieldsetController, Textarea} from '@play/pylon';
import {Section, SectionTitle} from './shared';
import type {GameSettingsFormValues, SectionProps} from './types';

export function BasicInfoSection({disabled}: SectionProps) {
  const {control} = useFormContext<GameSettingsFormValues>();

  return (
    <Section>
      <SectionTitle>About</SectionTitle>

      <FieldsetController
        control={control}
        name="summary"
        fieldsetProps={{label: 'Summary'}}
        render={({controlledProps}) => (
          <Textarea
            {...controlledProps}
            placeholder="A short description of your game"
            rows={3}
            disabled={disabled}
            className="w-full"
          />
        )}
      />

      <FieldsetController
        control={control}
        name="aboutTheGame"
        fieldsetProps={{label: 'About the game'}}
        render={({controlledProps}) => (
          <Textarea
            {...controlledProps}
            placeholder="Full about-the-game text..."
            rows={6}
            disabled={disabled}
            className="w-full"
          />
        )}
      />
    </Section>
  );
}
