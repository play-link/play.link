import {SegmentedControls} from './SegmentedControls';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'SegmentedControls',
  component: SegmentedControls,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div className="flex flex-col gap-4 items-start">
      <SegmentedControls
        items={[
          {label: 'Overview', value: 'overview'},
          {label: 'Projects', value: 'projects'},
          {label: 'About', value: 'about'},
        ]}
      />
    </div>
  );
}

export const Default = Template.bind({});
