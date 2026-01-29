import {XIcon} from 'lucide-react';
import {Avatar} from '../../src/components/avatar';
import {IconButton} from '../../src/components/icon-button';
import {Select} from '../../src/components/select';
import {Table} from '../../src/components/table/Table';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/Table',
  component: Table,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <Table
      data={[
        {name: 'John Doe', age: 25, email: '', phone: ''},
        {name: 'Jane Doe', age: 26, email: '', phone: ''},
        {name: 'John Smith', age: 27, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
        {name: 'Jane Smith', age: 28, email: '', phone: ''},
        {name: 'John Johnson', age: 29, email: '', phone: ''},
        {name: 'Jane Johnson', age: 30, email: '', phone: ''},
      ]}
      columns={[
        {
          accessor: 'name',
          title: 'Name',
          type: 'string',
          renderContent: ({d}) => (
            <div className="items-center flex gap-2">
              <Avatar size="sm" text={d.name} />
              <div>{d.name}</div>
            </div>
          ),
        },
        {accessor: 'age', title: 'Age', type: 'number'},
        {
          renderContent: () => (
            <Select
              options={[
                {label: 'Option 1', value: 'option1'},
                {label: 'Option 2', value: 'option2'},
                {label: 'Option 3', value: 'option3'},
              ]}
            />
          ),
        },
        {
          renderContent: () => (
            <IconButton aria-label="Close" size="md">
              <XIcon size={20} />
            </IconButton>
          ),
        },
      ]}
      sortBy="-name"
    />
  );
}

export const Default = Template.bind({});
