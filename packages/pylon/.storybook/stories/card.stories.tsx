import {Card} from '../../src/components/card/Card';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/Card',
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
