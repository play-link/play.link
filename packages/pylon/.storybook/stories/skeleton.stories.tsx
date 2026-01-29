import {Skeleton} from '../../src/components/loading/Skeleton';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/Skeleton',
  component: Skeleton,
  decorators: [ProvidersDecorator],
};

function Template() {
  return <Skeleton width="300px" animation height="300px" variant="circular" />;
}

export const Default = Template.bind({});
