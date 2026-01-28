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
import styled from 'styled-components';
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

interface DashboardLayoutProps {
  children: ReactNode;
  navItems?: NavItem[];
}

export function DashboardLayout({
  children,
  navItems = defaultNavItems,
}: DashboardLayoutProps) {
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
    <Root>
      <Sidebar>
        <LogoSection>
          <Logo>
            Play.link <LogoAccent>Studio</LogoAccent>
          </Logo>
          <Select
            options={orgOptions}
            value={activeOrganization.slug}
            onChange={handleOrgChange}
            fullWidth
            size="sm"
            variant="ghost"
          />
        </LogoSection>

        <Nav>
          <NavList>
            {navItems.map((item) => {
              const to = `/${activeOrganization.slug}${item.path ? `/${item.path}` : ''}`;
              return (
                <li key={item.path}>
                  <StyledNavLink to={to} end={item.path === ''}>
                    <Icon icon={item.icon} size={20} />
                    {item.label}
                  </StyledNavLink>
                </li>
              );
            })}
          </NavList>
        </Nav>

        <UserSection>
          <UserCard>
            <Avatar text={displayName} src={me.avatarUrl ?? undefined} size="md" />
            <UserInfo>
              <UserName>{displayName}</UserName>
              <UserEmail>{me.email}</UserEmail>
            </UserInfo>
          </UserCard>
          <SignOutButton onClick={signOut}>
            <Icon icon={LogOutIcon} size={20} />
            Sign out
          </SignOutButton>
        </UserSection>
      </Sidebar>

      <Main>{children}</Main>
    </Root>
  );
}

const Root = styled.div`
  display: flex;
  min-height: 100vh;
  background: var(--bg-body);
`;

const Sidebar = styled.aside`
  width: 16rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
`;

const LogoSection = styled.div`
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
`;

const Logo = styled.h1`
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--white);
  padding: 0 var(--spacing-2);
`;

const LogoAccent = styled.span`
  color: var(--primary-muted);
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

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2-5) var(--spacing-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg-muted);
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background: var(--bg-subtle);
    color: var(--white);
  }

  &.active {
    background: color-mix(in srgb, var(--primary-bg) 20%, transparent);
    color: var(--primary-muted);
  }
`;

const UserSection = styled.div`
  padding: var(--spacing-3);
  border-top: 1px solid var(--border-subtle);
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-subtle) 50%, transparent);
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
  color: var(--fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-2-5) var(--spacing-3);
  margin-top: var(--spacing-2);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg-muted);
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background: var(--bg-subtle);
    color: var(--white);
  }
`;

const Main = styled.main`
  flex: 1;
  overflow: auto;
`;
