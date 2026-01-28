import type {LucideIcon} from 'lucide-react';
import {
  GamepadIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import type {ReactNode} from 'react';
import {useMemo} from 'react';
import {NavLink, useNavigate} from 'react-router';
import {Avatar, Icon, Select} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {useAuth} from '@/lib/auth';

export interface NavItem {
  label: string;
  /** Path relative to org (e.g., "" for home, "games" for games page) */
  path: string;
  icon: LucideIcon;
}

const defaultNavItems: NavItem[] = [
  {label: 'Home', path: '', icon: HomeIcon},
  {label: 'Games', path: 'games', icon: GamepadIcon},
  {label: 'Members', path: 'members', icon: UsersIcon},
  {label: 'Settings', path: 'settings', icon: SettingsIcon},
];

interface SidebarLayoutProps {
  children: ReactNode;
  navItems?: NavItem[];
}

export function SidebarLayout({
  children,
  navItems = defaultNavItems,
}: SidebarLayoutProps) {
  const {me, activeOrganization} = useAppContext(ContextLevel.AuthenticatedWithOrg);
  const {signOut} = useAuth();
  const navigate = useNavigate();

  const displayName = me.displayName || me.email.split('@')[0];

  const orgOptions = useMemo(
    () =>
      me.organizations.map((org) => ({
        label: org.name,
        value: org.slug,
      })),
    [me.organizations],
  );

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSlug = e.target.value;
    if (newSlug && newSlug !== activeOrganization.slug) {
      navigate(`/${newSlug}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-slate-800">
        {/* Logo & Org Selector */}
        <div className="p-4 space-y-3">
          <h1 className="text-xl font-bold text-white px-2">
            Play.link <span className="text-purple-400">Studio</span>
          </h1>
          <Select
            options={orgOptions}
            value={activeOrganization.slug}
            onChange={handleOrgChange}
            fullWidth
            size="sm"
            variant="ghost"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const to = `/${activeOrganization.slug}${item.path ? `/${item.path}` : ''}`;
              return (
                <li key={item.path}>
                  <NavLink
                    to={to}
                    end={item.path === ''}
                    className={({isActive}) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon icon={item.icon} size={20} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <Avatar text={displayName} src={me.avatarUrl ?? undefined} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{me.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Icon icon={LogOutIcon} size={20} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
