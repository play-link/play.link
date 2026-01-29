import {DescriptionList} from '../../src/components/description-list/DescriptionList';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/DescriptionList',
  component: DescriptionList,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <DescriptionList>
      <DescriptionList.Item title="Item Title 1">Value</DescriptionList.Item>
      <DescriptionList.Item
        title="Item Title 2"
        tooltipProps={{
          text: 'Tootlip Text',
        }}
      >
        Value
      </DescriptionList.Item>
    </DescriptionList>
  );
}

export const Default = Template.bind({});
