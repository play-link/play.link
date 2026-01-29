import type {Meta, StoryObj} from '@storybook/react';
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartBarIncreasingIcon,
  CheckIcon,
  ChevronRightIcon,
  HomeIcon,
  InfoIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  Trash2Icon,
} from 'lucide-react';
import {Button} from '../../src/components/button/Button';
import {BUTTON_SIZES, BUTTON_VARIANTS} from '../../src/components/button/variants';
import {Card} from '../../src/components/card';
import {ProvidersDecorator} from '../Providers';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  decorators: [ProvidersDecorator],
  argTypes: {
    variant: {
      control: 'select',
      options: BUTTON_VARIANTS,
      description: 'Visual style of the button',
      table: {defaultValue: {summary: 'default'}},
    },
    size: {
      control: 'select',
      options: BUTTON_SIZES,
      description: 'Size of the button',
      table: {defaultValue: {summary: 'md'}},
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    withArrow: {
      control: 'boolean',
      description: 'Adds a dropdown arrow icon',
    },
    fullRounded: {
      control: 'boolean',
      description: 'Makes the button fully rounded (pill shape)',
    },
    autoHeight: {
      control: 'boolean',
      description: 'Removes fixed height, button height adapts to content',
    },
    to: {
      control: 'text',
      description: 'When provided, renders as a NavLink instead of a button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// =============================================================================
// ALL EXAMPLES (Single Page)
// =============================================================================

/** Complete button documentation with all variants, sizes, icons, states, and examples */
export const AllExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-12">
      {/* VARIANTS */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Variants</h2>
        <div className="flex flex-col gap-6">
          {/* Primary Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Primary Actions</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="default">Default</Button>
              <Button variant="muted">Muted</Button>
            </div>
          </div>

          {/* Outline & Ghost */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Outline & Ghost</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="outline">Outline</Button>
              <Button variant="outline-muted">Outline Muted</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          {/* Destructive */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Destructive</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="destructive">Destructive</Button>
              <Button variant="destructive-soft">Destructive Soft</Button>
            </div>
          </div>

          {/* Context Menu */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Context Menu (menu variant)</h3>
            <Card className="flex flex-col gap-2 w-64" padding={1}>
              <Button variant="menu">
                <CalendarIcon size={18} className="mr-3" />
                Navigation Item
              </Button>
              <Button variant="menu">
                <MoreHorizontalIcon size={18} className="mr-3" />
                Menu Item
              </Button>
              <Button variant="menu-destructive">
                <Trash2Icon size={18} className="mr-3" />
                Delete Item
              </Button>
            </Card>
          </div>

          {/* Nav */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Nav (nav variant)</h3>
            <div className="flex gap-2">
              <Button variant="nav">
                <HomeIcon size={18} className="mr-3" />
                Overview
              </Button>
              <Button variant="nav">
                <ChartBarIncreasingIcon size={18} className="mr-3" />
                Analytics
              </Button>
              <Button variant="nav">
                <SettingsIcon size={18} className="mr-3" />
                Settings
              </Button>
            </div>
          </div>

          {/* Special */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Special</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="link">Link Style</Button>
              <Button variant="unstyled">Unstyled</Button>
            </div>
          </div>
        </div>
      </section>

      {/* SIZES */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Sizes</h2>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500">xs</span>
            <Button size="xs" variant="primary">
              Extra Small
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500">sm</span>
            <Button size="sm" variant="primary">
              Small
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500">md</span>
            <Button size="md" variant="primary">
              Medium
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500">lg</span>
            <Button size="lg" variant="primary">
              Large
            </Button>
          </div>
        </div>
      </section>

      {/* WITH ICONS */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">With Icons</h2>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Leading</h3>
              <div className="flex gap-3">
                <Button variant="primary">
                  <PlusIcon size={18} className="mr-2" />
                  Add
                </Button>
                <Button variant="outline">
                  <ArrowRightIcon size={18} className="mr-2" />
                  Download
                </Button>
                <Button variant="destructive">
                  <Trash2Icon size={18} className="mr-2" />
                  Delete
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Trailing</h3>
              <div className="flex gap-3">
                <Button variant="primary">
                  Continue
                  <ArrowRightIcon size={18} className="ml-2" />
                </Button>
                <Button variant="outline">
                  Open
                  <ChevronRightIcon size={18} className="ml-2" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">With Arrow</h3>
              <div className="flex gap-3">
                <Button variant="outline" withArrow>
                  Select
                </Button>
                <Button variant="primary" withArrow>
                  <SearchIcon size={18} className="mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Icon Sizes</h3>
            <div className="flex items-end gap-3">
              <Button size="xs" variant="outline">
                <CheckIcon size={14} className="mr-2" />
                xs
              </Button>
              <Button size="sm" variant="outline">
                <CheckIcon size={16} className="mr-2" />
                sm
              </Button>
              <Button size="md" variant="outline">
                <CheckIcon size={18} className="mr-2" />
                md
              </Button>
              <Button size="lg" variant="outline">
                <CheckIcon size={20} className="mr-2" />
                lg
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* STATES */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">States</h2>
        <div className="flex flex-wrap gap-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Disabled</h3>
            <div className="flex gap-3">
              <Button variant="primary" disabled>
                Primary
              </Button>
              <Button variant="outline" disabled>
                Outline
              </Button>
              <Button variant="destructive" disabled>
                Destructive
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Active</h3>
            <div className="flex gap-3">
              <Button variant="outline" className="active">
                Outline
              </Button>
              <Button variant="ghost" className="active">
                Ghost
              </Button>
              <Button variant="nav" className="active">
                <CalendarIcon size={18} className="mr-2" />
                Nav
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SHAPE VARIATIONS */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Shape Variations</h2>
        <div className="flex flex-wrap gap-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Full Rounded (Pill)</h3>
            <div className="flex gap-3">
              <Button variant="primary" fullRounded>
                Pill
              </Button>
              <Button variant="outline" fullRounded>
                <InfoIcon size={18} className="mr-2" />
                With Icon
              </Button>
              <Button variant="muted" fullRounded size="sm">
                Small
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Auto Height</h3>
            <Button variant="outline" autoHeight className="py-4 px-6">
              <div className="flex flex-col items-center">
                <span className="text-lg">🎉</span>
                <span>Multi-line</span>
                <span className="text-xs text-gray-500">with auto height</span>
              </div>
            </Button>
          </div>
        </div>
      </section>

      {/* AS LINK */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">As Link (NavLink)</h2>
        <p className="text-sm text-gray-500 mb-3">
          When <code className="bg-gray-100 px-1 rounded">to</code> prop is provided, renders as
          NavLink.
        </p>
        <div className="flex gap-3">
          <Button to="/dashboard" variant="primary">
            Dashboard
          </Button>
          <Button to="/settings" variant="outline">
            <SettingsIcon size={18} className="mr-2" />
            Settings
          </Button>
          <Button to="/help" variant="ghost">
            Help
            <ChevronRightIcon size={18} className="mr-2" />
          </Button>
        </div>
      </section>

      {/* REAL WORLD EXAMPLES */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Real World Examples</h2>
        <div className="flex flex-wrap gap-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Form Actions</h3>
            <div className="flex gap-3">
              <Button variant="muted">Cancel</Button>
              <Button variant="primary">Save Changes</Button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Confirmation</h3>
            <div className="flex gap-3">
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">
                <Trash2Icon size={18} className="mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Dropdowns</h3>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" withArrow>
                <SearchIcon size={16} className="mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" withArrow>
                Sort
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">CTA</h3>
            <Button variant="primary" size="lg">
              Get Started
              <ArrowRightIcon size={20} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  ),
};
