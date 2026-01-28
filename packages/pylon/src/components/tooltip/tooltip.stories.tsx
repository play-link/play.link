import {Button} from '../button';
import {Tooltip} from './Tooltip';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Tooltip',
  component: Tooltip,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <Tooltip
      text="Text"
      title="Title"
      delay={400}
      overlayPosition={{
        verticalOffset: -12,
      }}
    >
      <Button
        onClick={() => console.log('clicked')}
        onMouseEnter={() => console.log('mouse enter')}
        onMouseLeave={() => console.log('mouse leave')}
        onFocus={() => console.log('focus')}
        onBlur={() => console.log('blur')}
        onPointerEnter={() => console.log('pointer enter')}
        onPointerLeave={() => console.log('pointer leave')}
        onAnimationStart={() => console.log('animation start')}
        onAnimationEnd={() => console.log('animation end')}
        onAnimationIteration={() => console.log('animation iteration')}
      >
        Button
      </Button>
    </Tooltip>
  );
}

export const Default = Template.bind({});
