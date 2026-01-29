import {Input} from '../../src/components/input/Input';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/Input',
  component: Input,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <>
      <div className="flex flex-col items-center gap-6 mt-10">
        <h4>Types</h4>
        <div className="flex flex-col items-center gap-4">
          <Input placeholder="Write here..." id="a" />
          <Input placeholder="Write here... (Disabled)" disabled defaultValue="df" />
          <Input defaultValue="invalid value" invalid />
        </div>
        <h4>Sizes</h4>
        <div className="flex items-center gap-4">
          <Input placeholder="This is sm" size="sm" />
          <Input placeholder="This is md" size="md" />
          <Input placeholder="This is lg" size="lg" />
        </div>
      </div>
    </>
  );
}

export const Default = Template.bind({});
