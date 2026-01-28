import {useState} from 'react';
import styled, {css} from 'styled-components';
import {Button} from '../button';
import {Overlay} from './Overlay';
import {useOverlay} from './use-overlay';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Overlay',
  component: Overlay,
  decorators: [ProvidersDecorator],
};

function Template() {
  const [opened1, setOpened1] = useState(false);
  const [opened2, setOpened2] = useState(false);
  const {openOverlay} = useOverlay();

  return (
    <>
      <Button
        onClick={() => {
          openOverlay((opened, setOpened) => (
            <Overlay
              opened={opened}
              setOpened={setOpened}
              cancelOnEscKey
              cancelOnOutsideClick
              disableBodyScroll
              withBackdrop
              position={{
                mode: 'centered',
              }}
              style={{
                background: 'white',
              }}
            >
              hey
            </Overlay>
          ));
        }}
      >
        open-overlay
      </Button>
      <div className="mt-10 flex flex-col gap-4 items-center">
        <Button onMouseDown={() => setOpened1((p) => !p)}>
          animation="pop", position=
          {`{{centered: true}}`}
        </Button>
      </div>
      <StyledOverlay
        animation="scale-in"
        opened={opened1}
        setOpened={setOpened1}
        cancelOnEscKey
        cancelOnOutsideClick
        disableBodyScroll
        withBackdrop
        position={{
          mode: 'centered',
        }}
        containerCss={css`
          padding: 20px;
        `}
        transparentBackdrop
      >
        <Button onMouseDown={() => setOpened2((p) => !p)}>Open another</Button>
        <div>Test</div>
      </StyledOverlay>
      <StyledOverlay
        animation="pop"
        opened={opened2}
        setOpened={setOpened2}
        cancelOnEscKey
        cancelOnOutsideClick
        disableBodyScroll
        position={{
          mode: 'centered',
        }}
      >
        <div>overlay2</div>
        <Button
          onClick={() => {
            setOpened1(false);
          }}
        >
          close overlay1
        </Button>
      </StyledOverlay>
    </>
  );
}

const StyledOverlay = styled(Overlay)`
  background: var(--bg-overlay);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-height: 100%;
  max-width: 43.75rem;
  overflow-y: auto;
  padding: var(--spacing-8);
  width: 100%;
`;

export const Default = Template.bind({});
