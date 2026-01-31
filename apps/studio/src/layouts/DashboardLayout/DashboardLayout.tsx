import type {LucideIcon} from 'lucide-react';
import {
  BuildingIcon,
  ChartBarIcon,
  ChevronDownIcon,
  CreditCardIcon,
  GamepadIcon,
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
  /** Path relative to org (e.g., "" for home, "games" for games page) */
  path: string;
  icon: LucideIcon;
}

const defaultNavItems: NavItem[] = [
  {label: 'Games', path: '', icon: GamepadIcon},
  {label: 'Campaigns', path: 'campaigns', icon: MegaphoneIcon},
  {label: 'Audience', path: 'audience', icon: MailIcon},
  {label: 'Analytics', path: 'analytics', icon: ChartBarIcon},
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
  const {activeOrganization} = useAppContext(ContextLevel.AuthenticatedWithOrg);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  return (
    <Root>
      <Sidebar>
        <LogoSection>
          <Logo>
            Play.link <LogoAccent>Studio</LogoAccent>
          </Logo>
        </LogoSection>

        <Nav>
          <NavList>
            {navItems.map((item) => {
              const to = `/${activeOrganization.slug}${item.path ? `/${item.path}` : ''}`;
              return (
                <li key={item.path}>
                  <Button
                    variant="nav"
                    to={to}
                    end={item.path === ''}
                    className="w-full"
                  >
                    <Icon icon={item.icon} size={20} className="mr-3" />
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
                <Icon icon={SettingsIcon} size={20} className="mr-3" />
                Settings
                <SettingsChevron $expanded={settingsExpanded}>
                  <Icon icon={ChevronDownIcon} size={16} />
                </SettingsChevron>
              </Button>

              {settingsExpanded && (
                <SettingsSubList>
                  {settingsItems.map((item) => {
                    const to = `/${activeOrganization.slug}/${item.path}`;
                    return (
                      <li key={item.path}>
                        <Button variant="nav" to={to} className="w-full">
                          <div className="flex items-center pl-7">
                            <Icon icon={item.icon} size={18} className="mr-3" />
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
  background: var(--bg-surface);
  border-right: 1px solid var(--border-muted);
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
`;

const Logo = styled.h1`
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--white);
  padding: 0 var(--spacing-2);
`;

const LogoAccent = styled.span`
  color: var(--color-primary-400);
`;

const Nav = styled.nav`
  flex: 1;
  padding: 0 var(--spacing-3);
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
