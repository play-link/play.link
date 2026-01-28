import {CheckIcon, HeartIcon, MoreHorizontalIcon, XIcon} from 'lucide-react';
import {IconButton} from './IconButton';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'IconButton',
  component: IconButton,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div>
      <div className="flex flex-col items-center gap-6 mt-10">
        <h4>Variants</h4>
        <div className="flex items-center gap-4">
          <div className="items-center flex flex-col gap-1">
            <IconButton aria-label="Check" variant="unstyled">
              <CheckIcon size={20} />
            </IconButton>
            unstyled
          </div>
          <div className="items-center flex flex-col gap-1">
            <IconButton aria-label="Heart" variant="default">
              <HeartIcon size={20} />
            </IconButton>
            default
          </div>
          <div className="items-center flex flex-col gap-1">
            <IconButton aria-label="More" variant="muted">
              <MoreHorizontalIcon size={20} />
            </IconButton>
            muted
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 mt-10">
        <h4>Sizes</h4>
        <div className="flex items-center gap-4">
          <IconButton aria-label="Close small" size="sm">
            <XIcon size={14} />
          </IconButton>
          <IconButton aria-label="Close medium" size="md">
            <XIcon size={18} />
          </IconButton>
          <IconButton aria-label="Close large" size="lg">
            <XIcon size={22} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export const Default = Template.bind({});
