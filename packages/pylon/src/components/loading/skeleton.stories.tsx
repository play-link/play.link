import {Skeleton} from './Skeleton';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Skeleton',
  component: Skeleton,
  decorators: [ProvidersDecorator],
};

function Template() {
  return <Skeleton width="300px" animation height="300px" variant="circular" />;
}

export const Default = Template.bind({});
