import {InputFile} from './InputFile';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'InputFile',
  component: InputFile,
  decorators: [ProvidersDecorator],
};

const Template = () => <InputFile />;

export const Default = Template.bind({});
