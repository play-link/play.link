import {Loading} from './Loading';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Loading',
  component: Loading,
  decorators: [ProvidersDecorator],
};

function Template() {
  return <Loading size="xs" />;
}

export const Default = Template.bind({});
