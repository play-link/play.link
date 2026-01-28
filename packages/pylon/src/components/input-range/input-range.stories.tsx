import styled from 'styled-components';
import {NativeInputRange} from './InputRange';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'NativeInputRange',
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
