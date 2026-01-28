import {Switch} from './Switch';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Switch',
  component: Switch,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div className="pt-10 pl-10 flex flex-col gap-4">
      <Switch size="sm" />
      <Switch size="md" />
      <Switch size="lg" />
    </div>
  );
}

export const Default = Template.bind({});
