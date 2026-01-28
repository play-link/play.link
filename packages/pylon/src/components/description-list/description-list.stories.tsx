import {DescriptionList} from './DescriptionList';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'DescriptionList',
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
