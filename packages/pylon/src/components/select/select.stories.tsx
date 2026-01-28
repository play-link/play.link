import {useState} from 'react';
import styled from 'styled-components';
import {Button} from '../button';
import {Overlay} from '../overlay';
import {Select} from './Select';
import type {SelectVariant} from './variants';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Select',
  component: Select,
  decorators: [ProvidersDecorator],
};

function Template() {
  const [opened, setOpened] = useState(false);

  return (
    <div style={{height: '2000px'}}>
      <Button onClick={() => setOpened(true)}>open overlay</Button>
      <StyledOverlay
        opened={opened}
        setOpened={setOpened}
        cancelOnEscKey
        cancelOnOutsideClick
        position={{mode: 'centered'}}
        withBackdrop
        noAutoFocus
        disableBodyScroll
      >
        <div className="flex gap-6 items-start">
          <Select
            placeholder="Select one!"
            onChange={(evt) => {
              console.log(evt);
            }}
            size="sm"
            options={[
              {
                value: '1',
                label: 'Madrid',
                description:
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.',
              },
              {value: '2', label: 'Barcelona'},
              {value: '3', label: 'Valencia'},
              {value: '4', label: 'Sevilla'},
              {value: '5', label: 'Zaragoza'},
              {value: '6', label: 'Málaga'},
              {value: '7', label: 'Murcia'},
              {value: '8', label: 'Palma'},
              {value: '9', label: 'Las Palmas de Gran Canaria'},
              {value: '10', label: 'Bilbao'},
              {value: '11', label: 'Alicante'},
              {value: '12', label: 'Córdoba'},
              {value: '13', label: 'Valladolid'},
              {value: '14', label: 'Vigo'},
              {value: '15', label: 'Gijón'},
              {value: '16', label: 'Hospitalet de Llobregat'},
              {value: '17', label: 'Vitoria'},
              {value: '18', label: 'La Coruña'},
              {value: '19', label: 'Granada'},
              {value: '20', label: 'Elche'},
              {value: '21', label: 'Oviedo'},
              {value: '22', label: 'Badalona'},
              {value: '23', label: 'Cartagena'},
              {value: '24', label: 'Terrassa'},
              {value: '25', label: 'Jerez de la Frontera'},
              {value: '26', label: 'Sabadell'},
              {value: '27', label: 'Móstoles'},
            ]}
          />
          <Select
            placeholder="Multiple Large!"
            onChange={(evt) => {
              console.log(evt);
            }}
            searchable
            defaultValue="15"
            options={[
              {value: '1', label: 'Madrid'},
              {value: '2', label: 'Barcelona'},
              {value: '3', label: 'Valencia'},
              {value: '4', label: 'Sevilla'},
              {value: '5', label: 'Zaragoza'},
              {value: '6', label: 'Málaga'},
              {value: '7', label: 'Murcia'},
              {value: '8', label: 'Palma'},
              {value: '9', label: 'Las Palmas de Gran Canaria'},
              {value: '10', label: 'Bilbao'},
              {value: '11', label: 'Alicante'},
              {value: '12', label: 'Córdoba'},
              {value: '13', label: 'Valladolid'},
              {value: '14', label: 'Vigo'},
              {value: '15', label: 'Gijón'},
              {value: '16', label: 'Hospitalet de Llobregat'},
              {value: '17', label: 'Vitoria'},
              {value: '18', label: 'La Coruña'},
              {value: '19', label: 'Granada'},
              {value: '20', label: 'Elche'},
              {value: '21', label: 'Oviedo'},
              {value: '22', label: 'Badalona'},
              {value: '23', label: 'Cartagena'},
              {value: '24', label: 'Terrassa'},
              {value: '25', label: 'Jerez de la Frontera'},
              {value: '26', label: 'Sabadell'},
              {value: '27', label: 'Móstoles'},
            ]}
          />
          <Select
            disabled
            placeholder="Disabled"
            options={[
              {label: 'Option 1', value: '1'},
              {label: 'Option 2', value: '2'},
            ]}
          />
        </div>
      </StyledOverlay>
    </div>
  );
}

const StyledOverlay = styled(Overlay)`
  width: 50rem;
  background: var(--bg-overlay);
  height: 20rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Default = Template.bind({});

// Helpers
const cities = [
  {value: '1', label: 'Madrid'},
  {value: '2', label: 'Barcelona'},
  {value: '3', label: 'Valencia'},
  {value: '4', label: 'Sevilla'},
  {value: '5', label: 'Zaragoza'},
  {value: '6', label: 'Málaga'},
  {value: '7', label: 'Murcia'},
  {value: '8', label: 'Palma'},
  {value: '9', label: 'Las Palmas de Gran Canaria'},
  {value: '10', label: 'Bilbao'},
  {value: '11', label: 'Alicante'},
  {value: '12', label: 'Córdoba'},
  {value: '13', label: 'Valladolid'},
  {value: '14', label: 'Vigo'},
  {value: '15', label: 'Gijón'},
  {value: '16', label: 'Hospitalet de Llobregat'},
  {value: '17', label: 'Vitoria'},
  {value: '18', label: 'La Coruña'},
  {value: '19', label: 'Granada'},
  {value: '20', label: 'Elche'},
  {value: '21', label: 'Oviedo'},
  {value: '22', label: 'Badalona'},
  {value: '23', label: 'Cartagena'},
  {value: '24', label: 'Terrassa'},
  {value: '25', label: 'Jerez de la Frontera'},
  {value: '26', label: 'Sabadell'},
  {value: '27', label: 'Móstoles'},
];

const allVariants: SelectVariant[] = [
  'default',
  'muted',
  'ghost',
  'outline',
  'outline-muted',
  'outline-rounded',
  'unstyled',
];

function VariantCell({
  variant,
  disabled,
  loading,
  invalid,
}: {
  variant: SelectVariant;
  disabled?: boolean;
  loading?: boolean;
  invalid?: boolean;
}) {
  return (
    <div style={{display: 'flex', gap: 12}}>
      {/*     <Select
        placeholder="Select..."
        options={cities}
        size="xs"
        variant={variant}
        disabled={disabled}
        loading={!!loading}
        invalid={!!invalid}
      />
      <Select
        placeholder="Select..."
        options={cities}
        size="sm"
        variant={variant}
        disabled={disabled}
        loading={!!loading}
        invalid={!!invalid}
      /> */}
      <Select
        placeholder="Select..."
        options={cities}
        size="md"
        variant={variant}
        disabled={disabled}
        loading={!!loading}
        invalid={!!invalid}
      />
    </div>
  );
}

export function AllVariants() {
  return (
    <div style={{display: 'grid', gap: 12}}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 1fr 1fr 1fr',
          gap: 12,
          fontWeight: 700,
        }}
      >
        <div>Variant</div>
        <div>Normal</div>
        <div>Disabled</div>
        <div>Loading</div>
        <div>Invalid</div>
      </div>
      {allVariants.map((variant) => (
        <div
          key={variant}
          style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 1fr 1fr 1fr',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div>{variant}</div>
          <VariantCell variant={variant} />
          <VariantCell variant={variant} disabled />
          <VariantCell variant={variant} loading />
          <VariantCell variant={variant} invalid />
        </div>
      ))}
    </div>
  );
}
