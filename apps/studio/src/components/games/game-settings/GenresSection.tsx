import {useFormContext} from 'react-hook-form';
import {FieldsetController, Select} from '@play/pylon';
import {Section, SectionTitle} from './shared';
import type {GameSettingsFormValues, SectionProps} from './types';

const GENRE_OPTIONS = [
  {label: 'Action', value: 'Action'},
  {label: 'Adventure', value: 'Adventure'},
  {label: 'RPG', value: 'RPG'},
  {label: 'Strategy', value: 'Strategy'},
  {label: 'Simulation', value: 'Simulation'},
  {label: 'Puzzle', value: 'Puzzle'},
  {label: 'Platformer', value: 'Platformer'},
  {label: 'Shooter', value: 'Shooter'},
  {label: 'Racing', value: 'Racing'},
  {label: 'Sports', value: 'Sports'},
  {label: 'Horror', value: 'Horror'},
  {label: 'Survival', value: 'Survival'},
  {label: 'Sandbox', value: 'Sandbox'},
  {label: 'Fighting', value: 'Fighting'},
  {label: 'Roguelike', value: 'Roguelike'},
  {label: 'Visual Novel', value: 'Visual Novel'},
  {label: 'Metroidvania', value: 'Metroidvania'},
  {label: 'Card Game', value: 'Card Game'},
  {label: 'Tower Defense', value: 'Tower Defense'},
  {label: 'Indie', value: 'Indie'},
];

export function GenresSection({disabled}: SectionProps) {
  const {control} = useFormContext<GameSettingsFormValues>();

  return (
    <Section>
      <SectionTitle>Genres</SectionTitle>

      <FieldsetController
        control={control}
        name="genres"
        fieldsetProps={{label: 'Genres'}}
        render={({controlledProps}) => (
          <Select
            options={GENRE_OPTIONS}
            value={controlledProps.value || []}
            onChange={(e) => controlledProps.onChange(e.target.value)}
            multiple
            searchable
            placeholder="Select genres..."
            disabled={disabled}
          />
        )}
      />
    </Section>
  );
}
