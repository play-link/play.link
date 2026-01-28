import {Checkbox} from './Checkbox';
import {CheckboxGroup} from './CheckboxGroup';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Checkbox',
  component: Checkbox,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div className="flex flex-col gap-4">
      <Checkbox label="This is a label" defaultChecked />
      <Checkbox disabled label="disabled" />
      <div className="flex flex-col">
        Group
        <CheckboxGroup
          maxOptions={2}
          options={[
            {label: 'Option 1', value: '1'},
            {label: 'Option 2', value: '2'},
            {label: 'Option 3', value: '3'},
          ]}
        />
      </div>
    </div>
  );
}

export const Default = Template.bind({});
