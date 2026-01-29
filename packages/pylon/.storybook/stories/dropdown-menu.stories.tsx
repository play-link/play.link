import {Button} from '../../src/components/button';
import {DropdownMenu} from '../../src/components/dropdown-menu/DropdownMenu';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div className="flex gap-10">
      <DropdownMenu mode="mousedown">
        <Button>Click</Button>
        <Button variant="menu" iconLeading="alert">
          Button
        </Button>
        <Button variant="menu">Button</Button>
        <Button variant="menu">Button</Button>
      </DropdownMenu>

      <DropdownMenu mode="mousedown">
        <Button>Mousedown</Button>
        <Button variant="menu">Button</Button>
      </DropdownMenu>

      <DropdownMenu mode="mousedown">
        <Button>Mousedown</Button>
        <Button variant="menu">Button</Button>
      </DropdownMenu>

      <DropdownMenu mode="mousedown">
        <Button>Nested</Button>
        <DropdownMenu
          mode="hover"
          overlayPosition={{
            fitToScreen: true,
            flip: true,
            noHorizontalOverlap: true,
            verticalAlign: 'middle',
          }}
        >
          <Button variant="menu">Nested</Button>
          <Button variant="menu">Button</Button>
          <Button variant="menu">Button</Button>
          <Button variant="menu">Button</Button>
          <Button variant="menu">Button</Button>
        </DropdownMenu>
        <Button variant="menu">Button</Button>
        <Button variant="menu">Button</Button>
        <Button variant="menu">Button</Button>
      </DropdownMenu>
    </div>
  );
}

export const Default = Template.bind({});
