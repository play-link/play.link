import {Badge} from './Badge';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Badge',
  component: Badge,
  decorators: [ProvidersDecorator],
};

function Template() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Solid tone (default) */}
      <div>
        <h3 className="text-sm font-medium mb-3 fg-subtle">Solid (default)</h3>
        <div className="flex gap-3">
          <Badge>Info</Badge>
          <Badge intent="success" dot>
            Success
          </Badge>
          <Badge intent="error">Error</Badge>
          <Badge intent="warning">Warning</Badge>
        </div>
      </div>

      {/* Dark tone */}
      <div>
        <h3 className="text-sm font-medium mb-3 fg-subtle">Dark</h3>
        <div className="flex gap-3">
          <Badge tone="dark">Info</Badge>
          <Badge intent="success" tone="dark" dot>
            Success
          </Badge>
          <Badge intent="error" tone="dark">
            Error
          </Badge>
          <Badge intent="warning" tone="dark">
            Warning
          </Badge>
        </div>
      </div>

      {/* Outline tone */}
      <div>
        <h3 className="text-sm font-medium mb-3 fg-subtle">Outline</h3>
        <div className="flex gap-3">
          <Badge tone="outline">Info</Badge>
          <Badge intent="success" tone="outline">
            Success
          </Badge>
          <Badge intent="error" tone="outline">
            Error
          </Badge>
          <Badge intent="warning" tone="outline">
            Warning
          </Badge>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="text-sm font-medium mb-3 fg-subtle">Sizes</h3>
        <div className="flex items-center gap-3">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
        </div>
      </div>

      {/* With icon */}
      <div>
        <h3 className="text-sm font-medium mb-3 fg-subtle">With Icon</h3>
        <div className="flex gap-3">
          <Badge icon="info-circle">Info</Badge>
          <Badge intent="success" icon="check-circle">
            Success
          </Badge>
          <Badge intent="error" icon="alert">
            Error
          </Badge>
          <Badge intent="warning" icon="alert">
            Warning
          </Badge>
        </div>
      </div>

      {/* Numbers */}
      <div>
        <h3 className="text-sm font-medium mb-3 fg-subtle">Numbers</h3>
        <div className="flex gap-3">
          <Badge className="tabular-nums">1</Badge>
          <Badge className="tabular-nums">10</Badge>
          <Badge className="tabular-nums">100</Badge>
          <Badge className="tabular-nums">1000</Badge>
        </div>
      </div>
    </div>
  );
}

export const Default = Template.bind({});
