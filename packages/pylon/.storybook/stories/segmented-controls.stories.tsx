import {SegmentedControls} from '../../src/components/segmented-controls/SegmentedControls';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/SegmentedControls',
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
