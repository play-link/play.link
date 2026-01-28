import {Avatar} from './Avatar';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Avatar',
  component: Avatar,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div className="flex flex-col gap-2">
      <Avatar size="xs" text="aoo@bar.com" />
      <Avatar size="sm" text="aoo@bar.com" />
      <Avatar text="foo@bar.com" />
      <Avatar size="lg" />
    </div>
  );
}

export const Default = Template.bind({});
