import styled from 'styled-components';
import {NativeInputRange} from '../../src/components/input-range/InputRange';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/InputRange',
  component: NativeInputRange,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <Container>
      <NativeInputRange />
    </Container>
  );
}

export const Default = Template.bind({});

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-20);
  margin: 0 auto;
  max-width: 500px;
  padding: var(--spacing-10);
`;
