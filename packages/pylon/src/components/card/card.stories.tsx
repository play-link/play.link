import {Card} from './Card';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Card',
  component: Card,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div
      style={{
        padding: 'var(--spacing-10)',
      }}
    >
      <Card>This is a card</Card>
    </div>
  );
}

export const Default = Template.bind({});
