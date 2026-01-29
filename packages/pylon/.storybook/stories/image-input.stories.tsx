import {ImageInput} from '../../src/components/image-input/ImageInput';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/ImageInput',
  component: ImageInput,
  decorators: [ProvidersDecorator],
};

const Template = () => <ImageInput aspectFn={() => 1} />;

export const Default = Template.bind({});
