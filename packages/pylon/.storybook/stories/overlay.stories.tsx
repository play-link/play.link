import {useState} from 'react';
import styled, {css} from 'styled-components';
import {Button} from '../../src/components/button';
import {Overlay} from '../../src/components/overlay/Overlay';
import {useOverlay} from '../../src/components/overlay/use-overlay';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/Overlay',
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

function SizesTemplate() {
  const [openedSize, setOpenedSize] = useState<string | null>(null);

  const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <Button key={size} onClick={() => setOpenedSize(size)}>
          size="{size}"
        </Button>
      ))}
      {sizes.map((size) => (
        <Overlay
          key={size}
          opened={openedSize === size}
          setOpened={() => setOpenedSize(null)}
          cancelOnEscKey
          cancelOnOutsideClick
          withBackdrop
          size={size}
          position={{mode: 'centered'}}
          animation="scale-in"
          style={{
            background: 'var(--bg-overlay)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--spacing-6)',
          }}
        >
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Size: {size}</h2>
            <p>This overlay uses the "{size}" size preset.</p>
            <Button onClick={() => setOpenedSize(null)}>Close</Button>
          </div>
        </Overlay>
      ))}
    </div>
  );
}

export const Sizes = SizesTemplate.bind({});
