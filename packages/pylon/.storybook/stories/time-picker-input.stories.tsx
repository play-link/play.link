import {useState} from 'react';
import {TimePickerInput} from '../../src/components/time-picker-input/TimePickerInput';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/TimePickerInput',
  component: TimePickerInput,
  decorators: [ProvidersDecorator],
};

function Template() {
  const [value, setValue] = useState('');

  return (
    <>
      <div className="flex flex-col items-center gap-6 mt-10">
        <h4>Basic Time Picker</h4>
        <div className="flex flex-col items-center gap-4">
          <TimePickerInput
            placeholder="hh:mm"
            value={value}
            onChange={(newValue) => setValue(newValue)}
          />
          <div className="text-sm fg-muted">Selected time: {value || 'None'}</div>
        </div>

        <h4>Sizes</h4>
        <div className="flex flex-col items-center gap-4">
          <TimePickerInput placeholder="Small" size="sm" />
          <TimePickerInput placeholder="Medium" size="md" />
          <TimePickerInput placeholder="Large" size="lg" />
        </div>

        <h4>States</h4>
        <div className="flex flex-col items-center gap-4">
          <TimePickerInput placeholder="Disabled" disabled />
          <TimePickerInput placeholder="Invalid" invalid />
          <TimePickerInput placeholder="With value" value="14:30" />
        </div>

        <h4>Full Width</h4>
        <div className="w-64">
          <TimePickerInput placeholder="Full width" fullWidth />
        </div>
      </div>
    </>
  );
}

export const Default = Template.bind({});
