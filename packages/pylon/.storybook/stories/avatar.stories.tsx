import {Avatar} from '../../src/components/avatar/Avatar';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/Avatar',
  component: Avatar,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div className="flex flex-col gap-2">
      <Avatar size="sm" text="aoo@bar.com" />
      <Avatar text="foo@bar.com" />
      <Avatar size="lg" />
    </div>
  );
}

export const Default = Template.bind({});
