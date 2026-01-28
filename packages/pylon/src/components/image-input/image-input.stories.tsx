import {ImageInput} from './ImageInput';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'ImageInput',
  component: ImageInput,
  decorators: [ProvidersDecorator],
};

const Template = () => <ImageInput aspectFn={() => 1} />;

export const Default = Template.bind({});
