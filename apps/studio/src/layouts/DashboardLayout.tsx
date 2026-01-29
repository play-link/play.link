import type {LucideIcon} from 'lucide-react';
import {
  BuildingIcon,
  ChartBarIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  CreditCardIcon,
  FileTextIcon,
  GamepadIcon,
  GlobeIcon,
  LogOutIcon,
  MegaphoneIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import type {ReactNode} from 'react';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Avatar, Button, Divider, DropdownMenu, Icon} from '@play/pylon';
import {CreateOrgDialog} from '@/components/layout/CreateOrgDialog';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {useAuth} from '@/lib/auth';

export interface NavItem {
  label: string;
  /** Path relative to org (e.g., "" for home, "games" for games page) */
  path: string;
  icon: LucideIcon;
}

const defaultNavItems: NavItem[] = [
  {label: 'Games', path: '', icon: GamepadIcon},
  {label: 'Campaigns', path: 'campaigns', icon: MegaphoneIcon},
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
  const {me, activeOrganization} = useAppContext(
    ContextLevel.AuthenticatedWithOrg,
  );
  const {signOut} = useAuth();
  const navigate = useNavigate();
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const displayName = me.displayName || me.email.split('@')[0];

  const handleOrgClick = (slug: string) => {
    if (slug !== activeOrganization.slug) {
      navigate(`/${slug}`);
    }
  };

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

        <UserSection>
          <DropdownMenu
            overlayPosition={{
              verticalAlign: 'top',
              horizontalAlign: 'left',
              noVerticalOverlap: true,
              verticalOffset: 8,
            }}
          >
            <UserCardTrigger className="">
              <Avatar
                text={displayName}
                src={me.avatarUrl ?? undefined}
                size="md"
              />
              <UserInfo>
                <UserName>{displayName}</UserName>
                <UserEmail>{me.email}</UserEmail>
              </UserInfo>
            </UserCardTrigger>

            <MenuContent>
              <MenuHeader>
                <Avatar
                  text={displayName}
                  src={me.avatarUrl ?? undefined}
                  size="lg"
                />
                <MenuHeaderInfo>
                  <MenuHeaderName>{displayName}</MenuHeaderName>
                  <MenuHeaderEmail>{me.email}</MenuHeaderEmail>
                </MenuHeaderInfo>
              </MenuHeader>

              <Divider className="my-2" />

              <MenuSection>
                <MenuSectionTitle>Switch organization</MenuSectionTitle>
                {me.organizations.map((org) => (
                  <Button
                    key={org.id}
                    variant="menu"
                    onClick={() => handleOrgClick(org.slug)}
                    className="w-full"
                  >
                    <MenuItemIcon>
                      {org.id === activeOrganization.id && (
                        <Icon icon={CheckIcon} size={16} />
                      )}
                    </MenuItemIcon>
                    <Avatar text={org.name} size="sm" />
                    <span>{org.name}</span>
                  </Button>
                ))}
                <Button
                  variant="menu"
                  onClick={() => setCreateOrgOpen(true)}
                  className="w-full text-fg-muted"
                >
                  <MenuItemIcon />
                  <Icon icon={PlusIcon} size={18} />
                  <span>New organization</span>
                </Button>
              </MenuSection>

              <Divider className="my-2" />

              <Button variant="menu" className="w-full">
                <MenuItemIcon>
                  <Icon icon={UserIcon} size={16} />
                </MenuItemIcon>
                <span>Account settings</span>
              </Button>

              <Divider className="my-2" />

              <Button variant="menu" className="w-full">
                <MenuItemIcon>
                  <Icon icon={FileTextIcon} size={16} />
                </MenuItemIcon>
                <span>Terms</span>
              </Button>

              <Button variant="menu" className="w-full">
                <MenuItemIcon>
                  <Icon icon={CircleIcon} size={16} />
                </MenuItemIcon>
                <span>Privacy</span>
              </Button>

              <Divider className="my-2" />

              <Button variant="menu" onClick={signOut} className="w-full">
                <MenuItemIcon>
                  <Icon icon={LogOutIcon} size={16} />
                </MenuItemIcon>
                <span>Log out</span>
              </Button>
            </MenuContent>
          </DropdownMenu>
        </UserSection>
      </Sidebar>

      <Main>{children}</Main>

      <CreateOrgDialog opened={createOrgOpen} setOpened={setCreateOrgOpen} />
    </Root>
  );
}

const Root = styled.div`
  display: grid;
  grid-template-columns: 16rem 1fr;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  background: var(--bg-surface);
  border-right: 1px solid var(--border-muted);
  display: flex;
  flex-direction: column;
  min-width: 0;
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

const UserSection = styled.div`
  padding: var(--spacing-3);
  border-top: 1px solid var(--border);
`;

const UserCardTrigger = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-hover) 50%, transparent);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: var(--bg-hover);
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.p`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserEmail = styled.p`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MenuContent = styled.div`
  min-width: 14rem;
`;

const MenuHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
`;

const MenuHeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MenuHeaderName = styled.p`
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
`;

const MenuHeaderEmail = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;

const MenuSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const MenuSectionTitle = styled.p`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg-muted);
  padding: var(--spacing-2) var(--spacing-3);
`;

const MenuItemIcon = styled.span`
  width: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Main = styled.main`
  flex: 1;
  overflow: auto;
`;
