import type {LucideIcon} from 'lucide-react';
import {
  BuildingIcon,
  ChartLineIcon,
  ChevronDownIcon,
  CreditCardIcon,
  Gamepad2Icon,
  GlobeIcon,
  MailIcon,
  MegaphoneIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import type {ReactNode} from 'react';
import {useState} from 'react';
import styled from 'styled-components';
import {Button, Icon} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {UserMenuDropdown} from './UserMenuDropdown';

export interface NavItem {
  label: string;
  /** Path relative to studio (e.g., "" for home, "games" for games page) */
  path: string;
  icon: LucideIcon;
}

const defaultNavItems: NavItem[] = [
  {label: 'Games', path: '', icon: Gamepad2Icon},
  {label: 'Campaigns', path: 'campaigns', icon: MegaphoneIcon},
  {label: 'Audience', path: 'audience', icon: MailIcon},
  {label: 'Analytics', path: 'analytics', icon: ChartLineIcon},
];

const settingsItems: NavItem[] = [
  {label: 'Studio', path: 'settings/studio', icon: BuildingIcon},
  {label: 'Team', path: 'settings/team', icon: UsersIcon},
  {label: 'Domains', path: 'settings/domains', icon: GlobeIcon},
  {label: 'Billing', path: 'settings/billing', icon: CreditCardIcon},
];

interface DashboardLayoutProps {
  children: ReactNode;
  navItems?: NavItem[];
}

export function DashboardLayout({
  children,
  navItems = defaultNavItems,
}: DashboardLayoutProps) {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  return (
    <Root>
      <Sidebar>
        <Nav>
          <NavList>
            {navItems.map((item) => {
              const to = `/${activeStudio.slug}${item.path ? `/${item.path}` : ''}`;
              return (
                <li key={item.path}>
                  <Button
                    variant="nav"
                    to={to}
                    end={item.path === ''}
                    className="w-full"
                  >
                    <Icon
                      icon={item.icon}
                      size={16}
                      strokeWidth={2}
                      className="mr-3"
                    />
                    {item.label}
                  </Button>
                </li>
              );
            })}

            {/* Collapsible Settings Section */}
            <li>
              <Button
                variant="nav"
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="w-full"
              >
                <Icon
                  icon={SettingsIcon}
                  size={16}
                  strokeWidth={2}
                  className="mr-3"
                />
                Settings
                <SettingsChevron $expanded={settingsExpanded}>
                  <Icon icon={ChevronDownIcon} size={16} />
                </SettingsChevron>
              </Button>

              {settingsExpanded && (
                <SettingsSubList>
                  {settingsItems.map((item) => {
                    const to = `/${activeStudio.slug}/${item.path}`;
                    return (
                      <li key={item.path}>
                        <Button variant="nav" to={to} className="w-full">
                          <div className="flex items-center pl-7">
                            <Icon
                              icon={item.icon}
                              size={16}
                              strokeWidth={2}
                              className="mr-3"
                            />
                            {item.label}
                          </div>
                        </Button>
                      </li>
                    );
                  })}
                </SettingsSubList>
              )}
            </li>
          </NavList>
        </Nav>

        <UserMenuDropdown />
      </Sidebar>

      <Main>{children}</Main>
    </Root>
  );
}

const Root = styled.div`
  display: grid;
  grid-template-columns: 16rem 1fr;
  height: 100vh;
`;

const Sidebar = styled.aside`
  background: var(--bg-subtle);
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  margin: 0.75rem;
  border-radius: var(--radius-2xl);
  padding: var(--spacing-2-5);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--bg);
`;

const Nav = styled.nav`
  flex: 1;
`;

const NavList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const SettingsChevron = styled.span<{$expanded: boolean}>`
  margin-left: auto;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
  transform: ${({$expanded}) => ($expanded ? 'rotate(180deg)' : 'rotate(0)')};
`;

const SettingsSubList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin-top: var(--spacing-1);
`;

const Main = styled.main`
  overflow: auto;
`;
