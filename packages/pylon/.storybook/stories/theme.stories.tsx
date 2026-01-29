import {
  Bell,
  ChevronRight,
  HelpCircle,
  Home,
  Mail,
  Plane,
  Search,
  Settings,
  ShoppingCart,
  User,
} from 'lucide-react';
import {useState} from 'react';
import {Avatar} from '../../src/components/avatar';
import {Badge} from '../../src/components/badge';
import {Button} from '../../src/components/button';
import {Card} from '../../src/components/card';
import {Checkbox} from '../../src/components/checkbox';
import {IconButton} from '../../src/components/icon-button';
import {Input} from '../../src/components/input';
import {ProgressBar} from '../../src/components/progress-bar';
import {Select} from '../../src/components/select';
import {Switch} from '../../src/components/switch';

export default {
  title: 'Theme',
};

const PRIMARY_SHADES = [
  {shade: '50', var: '--color-primary-50'},
  {shade: '100', var: '--color-primary-100'},
  {shade: '200', var: '--color-primary-200'},
  {shade: '300', var: '--color-primary-300'},
  {shade: '400', var: '--color-primary-400'},
  {shade: '500', var: '--color-primary-500'},
  {shade: '600', var: '--color-primary-600'},
  {shade: '700', var: '--color-primary-700'},
  {shade: '800', var: '--color-primary-800'},
  {shade: '900', var: '--color-primary-900'},
  {shade: '950', var: '--color-primary-950'},
];

const GRAY_SHADES = [
  {shade: '50', var: '--color-gray-50'},
  {shade: '100', var: '--color-gray-100'},
  {shade: '200', var: '--color-gray-200'},
  {shade: '300', var: '--color-gray-300'},
  {shade: '400', var: '--color-gray-400'},
  {shade: '500', var: '--color-gray-500'},
  {shade: '600', var: '--color-gray-600'},
  {shade: '700', var: '--color-gray-700'},
  {shade: '800', var: '--color-gray-800'},
  {shade: '900', var: '--color-gray-900'},
  {shade: '950', var: '--color-gray-950'},
];

function ColorSwatch({shade, cssVar}: {shade: string; cssVar: string}) {
  const isDark = Number.parseInt(shade) >= 600;
  return (
    <div
      style={{
        backgroundColor: `var(${cssVar})`,
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        minWidth: 72,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: isDark ? 'white' : 'var(--color-gray-900)',
        }}
      >
        {shade}
      </div>
    </div>
  );
}

function PaletteBar({shades, title}: {shades: {shade: string; var: string}[]; title: string}) {
  return (
    <div style={{marginBottom: 32}}>
      <div style={{fontSize: 'var(--text-sm)', color: 'var(--fg-subtle)', marginBottom: 8}}>
        {title}
      </div>
      <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
        {shades.map(({shade, var: cssVar}) => (
          <ColorSwatch key={shade} shade={shade} cssVar={cssVar} />
        ))}
      </div>
    </div>
  );
}

function CategoryItem({
  icon: Icon,
  name,
  count,
}: {
  icon: React.ComponentType<{size?: number; className?: string}>;
  name: string;
  count: string;
}) {
  return (
    <div className="flex items-center py-3 border-b border-(--border-muted)">
      <div className="w-9 h-9 rounded-full bg-(--color-primary-100) flex items-center justify-center mr-3">
        <Icon size={18} className="text-(--color-primary-600)" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-(--fg)">{name}</div>
        <div className="text-xs text-(--fg-subtle)">{count}</div>
      </div>
      <ChevronRight size={18} className="text-(--fg-subtle)" />
    </div>
  );
}

export function ColorPalette() {
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <div style={{padding: 32, backgroundColor: 'var(--bg)', minHeight: '100vh'}}>
      <h1 className="text-3xl font-bold text-(--fg) mb-2">Color System</h1>
      <p className="text-(--fg-subtle) mb-8">
        Design tokens and color palette for the Pylon design system
      </p>

      <PaletteBar shades={PRIMARY_SHADES} title="Primary" />
      <PaletteBar shades={GRAY_SHADES} title="Gray (Zinc)" />

      {/* Components Section */}
      <h2 className="text-xl font-semibold text-(--fg) mt-12 mb-6">Components</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Buttons Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Buttons</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="default">Default</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="md">
              Medium
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </div>
        </Card>

        {/* Badges Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Badges</h3>
          <div className="flex flex-wrap gap-2">
            <Badge intent="info">Info</Badge>
            <Badge intent="success">Success</Badge>
            <Badge intent="warning">Warning</Badge>
            <Badge intent="error">Error</Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge intent="info" tone="dark">
              Dark
            </Badge>
            <Badge intent="success" tone="dark">
              Dark
            </Badge>
            <Badge intent="warning" tone="dark">
              Dark
            </Badge>
            <Badge intent="error" tone="dark">
              Dark
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge intent="info" dot>
              With Dot
            </Badge>
            <Badge intent="success" dot>
              Active
            </Badge>
          </div>
        </Card>

        {/* Avatars Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Avatars</h3>
          <div className="flex items-center gap-3">
            <Avatar text="Jane Smith" size="sm" />
            <Avatar text="Bob Wilson" size="md" />
            <Avatar text="Alice Brown" size="lg" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Avatar
              text="With Image"
              size="md"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
            />
            <Avatar
              text="Another"
              size="md"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
            />
          </div>
        </Card>

        {/* Inputs Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Inputs</h3>
          <div className="flex flex-col gap-3">
            <Input placeholder="Default input" />
            <Input placeholder="Invalid input" invalid />
            <Input placeholder="Disabled input" disabled />
            <Input placeholder="Small input" size="sm" />
          </div>
        </Card>

        {/* Select Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Select</h3>
          <div className="flex flex-col gap-3">
            <Select
              options={[
                {label: 'Option 1', value: '1'},
                {label: 'Option 2', value: '2'},
                {label: 'Option 3', value: '3'},
              ]}
              placeholder="Choose an option"
              fullWidth
            />
            <Select
              options={[
                {label: 'Admin', value: 'admin'},
                {label: 'Member', value: 'member'},
                {label: 'Guest', value: 'guest'},
              ]}
              defaultValue="member"
              fullWidth
            />
          </div>
        </Card>

        {/* Controls Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Controls</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-(--fg)">Notifications</span>
              <Switch
                checked={switchChecked}
                onChange={(e) => setSwitchChecked(e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-(--fg)">Dark mode</span>
              <Switch defaultChecked={false} />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
              />
              <span className="text-(--fg)">I agree to terms</span>
            </div>
          </div>
        </Card>

        {/* Icon Buttons Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Icon Buttons</h3>
          <div className="flex items-center gap-2">
            <IconButton icon={Bell} variant="default" />
            <IconButton icon={Settings} variant="ghost" />
            <IconButton icon={User} variant="default" />
            <IconButton icon={Mail} variant="ghost" />
            <IconButton icon={Search} variant="default" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <IconButton icon={Bell} size="sm" />
            <IconButton icon={Bell} size="md" />
            <IconButton icon={Bell} size="lg" />
          </div>
        </Card>

        {/* Progress Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Progress</h3>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm text-(--fg-subtle) mb-1">25% Complete</div>
              <ProgressBar value={25} />
            </div>
            <div>
              <div className="text-sm text-(--fg-subtle) mb-1">50% Complete</div>
              <ProgressBar value={50} />
            </div>
            <div>
              <div className="text-sm text-(--fg-subtle) mb-1">75% Complete</div>
              <ProgressBar value={75} />
            </div>
          </div>
        </Card>

        {/* Card Variants */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Card Variants</h3>
          <div className="flex flex-col gap-3">
            <Card variant="muted" padding={3}>
              <span className="text-sm">Muted Card</span>
            </Card>
            <Card variant="warning" padding={3}>
              <span className="text-sm">Warning Card</span>
            </Card>
            <Card variant="error" padding={3}>
              <span className="text-sm">Error Card</span>
            </Card>
          </div>
        </Card>
      </div>

      {/* Example Usage Section */}
      <h2 className="text-xl font-semibold text-(--fg) mt-12 mb-6">Example Usage</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Categories List */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-2">Categories</h3>
          <CategoryItem icon={ShoppingCart} name="Groceries" count="9 transactions" />
          <CategoryItem icon={Home} name="Household" count="12 transactions" />
          <CategoryItem icon={Plane} name="Travel" count="6 transactions" />
          <CategoryItem icon={HelpCircle} name="Other" count="6 transactions" />
        </Card>

        {/* User Profile Card */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Avatar
              text="John Doe"
              size="lg"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
            />
            <div>
              <div className="font-semibold text-(--fg)">John Doe</div>
              <div className="text-sm text-(--fg-subtle)">john@example.com</div>
            </div>
            <Badge intent="success" className="ml-auto">
              Active
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="flex-1">
              Edit Profile
            </Button>
            <Button variant="ghost" size="sm">
              <Settings size={16} />
            </Button>
          </div>
        </Card>

        {/* Login Form Card */}
        <Card>
          <h3 className="font-semibold text-(--fg) mb-4">Sign In</h3>
          <div className="flex flex-col gap-3">
            <Input placeholder="Email address" type="email" />
            <Input placeholder="Password" type="password" />
            <div className="flex items-center gap-2">
              <Checkbox defaultChecked />
              <span className="text-sm text-(--fg-subtle)">Remember me</span>
            </div>
            <Button variant="primary" className="w-full">
              Sign In
            </Button>
          </div>
        </Card>
      </div>

      {/* Background Tokens */}
      <h2 className="text-xl font-semibold text-(--fg) mt-12 mb-6">Background Tokens</h2>

      <div className="flex gap-4 flex-wrap mb-8">
        <div className="p-3 px-6 bg-(--bg) border border-(--border-muted) rounded-lg">
          <div className="text-xs text-(--fg-subtle)">--bg</div>
        </div>
        <div className="p-3 px-6 bg-(--bg-subtle) rounded-lg">
          <div className="text-xs text-(--fg-subtle)">--bg-subtle</div>
        </div>
        <div className="p-3 px-6 bg-(--bg-muted) rounded-lg">
          <div className="text-xs text-(--fg-subtle)">--bg-muted</div>
        </div>
        <div className="p-3 px-6 bg-(--bg-surface) rounded-lg">
          <div className="text-xs text-(--fg-subtle)">--bg-surface</div>
        </div>
        <div className="p-3 px-6 bg-(--bg-overlay) rounded-lg">
          <div className="text-xs text-(--fg-subtle)">--bg-overlay</div>
        </div>
        <div className="p-3 px-6 bg-(--bg-hover) rounded-lg">
          <div className="text-xs text-(--fg-subtle)">--bg-hover</div>
        </div>
        <div className="p-3 px-6 bg-(--bg-press) rounded-lg">
          <div className="text-xs text-(--fg-subtle)">--bg-press</div>
        </div>
        <div className="p-3 px-6 bg-(--bg-selected) rounded-lg">
          <div className="text-xs text-(--fg)">--bg-selected</div>
        </div>
      </div>

      {/* Text Colors */}
      <h2 className="text-xl font-semibold text-(--fg) mt-8 mb-4">Text Colors</h2>

      <div className="flex flex-col gap-2">
        <p className="text-(--fg)">--fg: Primary text color</p>
        <p className="text-(--fg-subtle)">--fg-subtle: Tertiary text color</p>
        <p className="text-(--fg-muted)">--fg-muted: Secondary text color</p>
        <p className="text-(--fg-placeholder)">--fg-placeholder: Placeholder text color</p>
        <p className="text-(--fg-disabled)">--fg-disabled: Disabled text color</p>
        <p className="text-(--fg-error)">--fg-error: Error text color</p>
        <p className="text-(--fg-success)">--fg-success: Success text color</p>
        <p className="text-(--fg-warning)">--fg-warning: Warning text color</p>
      </div>

      {/* Border Colors */}
      <h2 className="text-xl font-semibold text-(--fg) mt-8 mb-4">Border Colors</h2>

      <div className="flex gap-4 flex-wrap">
        <div className="p-6 border-2 border-(--border) rounded-lg">
          <div className="text-sm text-(--fg-subtle)">--border (strong)</div>
        </div>
        <div className="p-6 border-2 border-(--border-subtle) rounded-lg">
          <div className="text-sm text-(--fg-subtle)">--border-subtle</div>
        </div>
        <div className="p-6 border-2 border-(--border-muted) rounded-lg">
          <div className="text-sm text-(--fg-subtle)">--border-muted</div>
        </div>
        <div className="p-6 border-2 border-(--border-focus) rounded-lg">
          <div className="text-sm text-(--fg-subtle)">--border-focus</div>
        </div>
      </div>

      {/* Primary Color Scale */}
      <h2 className="text-xl font-semibold text-(--fg) mt-8 mb-4">Primary Color Scale</h2>

      <div className="flex gap-2 flex-wrap">
        <div className="w-16 h-16 bg-(--color-primary-50) rounded flex items-center justify-center text-xs">
          50
        </div>
        <div className="w-16 h-16 bg-(--color-primary-100) rounded flex items-center justify-center text-xs">
          100
        </div>
        <div className="w-16 h-16 bg-(--color-primary-200) rounded flex items-center justify-center text-xs">
          200
        </div>
        <div className="w-16 h-16 bg-(--color-primary-300) rounded flex items-center justify-center text-xs">
          300
        </div>
        <div className="w-16 h-16 bg-(--color-primary-400) rounded flex items-center justify-center text-xs text-white">
          400
        </div>
        <div className="w-16 h-16 bg-(--color-primary-500) rounded flex items-center justify-center text-xs text-white">
          500
        </div>
        <div className="w-16 h-16 bg-(--color-primary-600) rounded flex items-center justify-center text-xs text-white">
          600
        </div>
        <div className="w-16 h-16 bg-(--color-primary-700) rounded flex items-center justify-center text-xs text-white">
          700
        </div>
        <div className="w-16 h-16 bg-(--color-primary-800) rounded flex items-center justify-center text-xs text-white">
          800
        </div>
        <div className="w-16 h-16 bg-(--color-primary-900) rounded flex items-center justify-center text-xs text-white">
          900
        </div>
      </div>
    </div>
  );
}
