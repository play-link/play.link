import {InputFile} from '../../src/components/input-file/InputFile';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/InputFile',
  component: InputFile,
  decorators: [ProvidersDecorator],
};

const Template = () => <InputFile />;

export const Default = Template.bind({});
