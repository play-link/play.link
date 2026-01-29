import {Loading} from '../../src/components/loading/Loading';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/Loading',
  component: Loading,
  decorators: [ProvidersDecorator],
};

function Template() {
  return <Loading size="xs" />;
}

export const Default = Template.bind({});
