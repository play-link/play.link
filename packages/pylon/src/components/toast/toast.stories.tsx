import styled from 'styled-components';
import {Button} from '../button';
import {Toast} from './Toast';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Toast',
  component: Toast,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <Container>
      <Toast>Info</Toast>
      <Toast severity="warning">Warning</Toast>
      <Toast severity="error">Something went wrong</Toast>
      <Toast severity="success">Success</Toast>
      <Toast severity="error">
        <p>
          Success lorem ipsum dolor sit amet success lorem ipsum dolor sit amet success lorem ipsum
          dolor sit amet
        </p>
        <Button variant="destructive" className="mt-2">
          Sign up
        </Button>
      </Toast>
      <Toast severity="error" onClickClose={() => {}}>
        <p>Success lorem ipsum dolor sit amet</p>
        <Button variant="destructive" className="mt-2">
          Sign up
        </Button>
      </Toast>
    </Container>
  );
}

export const Default = Template.bind({});

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-10);
  margin: 0 auto;
  max-width: 600px;
  padding: var(--spacing-10);
`;
