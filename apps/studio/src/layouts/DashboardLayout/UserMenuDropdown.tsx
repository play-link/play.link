import {
  BuildingIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  ShieldCheckIcon,
  SunIcon,
  UserIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {
  Avatar,
  Button,
  Divider,
  DropdownMenu,
  Icon,
  NavigationList,
  useTheme,
} from '@play/pylon';
import type {Theme} from '@play/pylon';
import {CreateStudioDialog} from '@/components/layout/CreateStudioDialog';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {useAuth} from '@/lib/auth';

const themeOptions: {value: Theme; label: string; icon: typeof SunIcon}[] = [
  {value: 'light', label: 'Light', icon: SunIcon},
  {value: 'dark', label: 'Dark', icon: MoonIcon},
  {value: 'system', label: 'System', icon: MonitorIcon},
];

export function UserMenuDropdown() {
  const {me, activeStudio} = useAppContext(
    ContextLevel.AuthenticatedWithStudio,
  );
  const {signOut} = useAuth();
  const {theme, setTheme} = useTheme();
  const navigate = useNavigate();
  const [createStudioOpen, setCreateStudioOpen] = useState(false);

  const handleStudioClick = (slug: string) => {
    if (slug !== activeStudio.slug) {
      navigate(`/${slug}`);
    }
  };

  return (
    <>
      <div>
        <DropdownMenu
          overlayPosition={{
            verticalAlign: 'top',
            horizontalAlign: 'left',
            noVerticalOverlap: true,
            verticalOffset: 4,
          }}
          closeOnClickSelectors={['[data-close-menu]']}
        >
          <UserCardTrigger>
            <Avatar
              text={activeStudio.name}
              src={activeStudio.avatar_url ?? undefined}
              size="xxs"
              shape="square"
            />
            <UserInfo>
              <UserName>{activeStudio.name}</UserName>
              <UserPlan>Free</UserPlan>
            </UserInfo>
            <TriggerChevron icon={ChevronDownIcon} size={14} />
          </UserCardTrigger>

          <DropdownContent>
            <SignedAs>Signed in as {me.email}</SignedAs>
            <Divider className="my-1" />
            <NavigationList noAutoFocus>
              <Button
                variant="menu"
                className="w-full"
                size="sm"
                data-close-menu
              >
                <Icon icon={UserIcon} size={16} className="mr-2.5" />
                <span>Account settings</span>
              </Button>
              <DropdownMenu
                mode="hover"
                overlayPosition={{
                  fitToScreen: true,
                  flip: true,
                  noHorizontalOverlap: true,
                  verticalAlign: 'middle',
                }}
              >
                <Button variant="menu" className="w-full" size="sm">
                  <Icon icon={SunIcon} size={16} className="mr-2.5" />
                  <span>Theme</span>
                  <Icon icon={ChevronRightIcon} size={14} className="ml-auto" />
                </Button>
                {themeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="menu"
                    onClick={() => setTheme(option.value)}
                    className="w-full"
                    size="sm"
                    data-close-menu
                  >
                    <ThemeRadio $active={theme === option.value} />
                    <Icon icon={option.icon} size={16} className="mr-2.5" />
                    <span>{option.label}</span>
                  </Button>
                ))}
              </DropdownMenu>
              <DropdownMenu
                mode="hover"
                overlayPosition={{
                  fitToScreen: true,
                  flip: true,
                  noHorizontalOverlap: true,
                  verticalAlign: 'middle',
                }}
              >
                <Button variant="menu" className="w-full" size="sm">
                  <Icon icon={BuildingIcon} size={16} className="mr-2.5" />
                  <span>Switch studio</span>
                  <Icon icon={ChevronRightIcon} size={14} className="ml-auto" />
                </Button>
                {me.studios.map((studio) => (
                  <Button
                    key={studio.id}
                    variant="menu"
                    onClick={() => handleStudioClick(studio.slug)}
                    className="w-full"
                    size="sm"
                    data-close-menu
                  >
                    {studio.id === activeStudio.id && (
                      <Icon icon={CheckIcon} size={16} className="mr-2.5" />
                    )}
                    <span>{studio.name}</span>
                  </Button>
                ))}
                <Button
                  variant="menu"
                  onClick={() => setCreateStudioOpen(true)}
                  className="w-full text-fg-muted"
                  size="sm"
                  data-close-menu
                >
                  <Icon icon={PlusIcon} size={16} className="mr-2.5" />
                  <span>New studio</span>
                </Button>
              </DropdownMenu>
              <Divider className="my-1" />
              <Button
                variant="menu"
                className="w-full"
                size="sm"
                data-close-menu
              >
                <Icon icon={FileTextIcon} size={16} className="mr-2.5" />
                <span>Terms</span>
              </Button>

              <Button
                variant="menu"
                className="w-full"
                size="sm"
                data-close-menu
              >
                <Icon icon={ShieldCheckIcon} size={16} className="mr-2.5" />
                <span>Privacy</span>
              </Button>
              <Divider className="my-1" />
              <Button
                variant="menu"
                onClick={signOut}
                className="w-full"
                size="sm"
                data-close-menu
              >
                <Icon icon={LogOutIcon} size={16} className="mr-2.5" />
                <span>Log out</span>
              </Button>
            </NavigationList>
          </DropdownContent>
        </DropdownMenu>
      </div>

      <CreateStudioDialog
        opened={createStudioOpen}
        setOpened={setCreateStudioOpen}
      />
    </>
  );
}

const UserCardTrigger = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-2) var(--spacing-2-5);
  border-radius: var(--radius-xl);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  &.opened {
    background: var(--bg-hover);
  }
`;

const TriggerChevron = styled(Icon)`
  color: var(--fg-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;

  .opened & {
    transform: rotate(180deg);
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.p`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserPlan = styled.p`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DropdownContent = styled.div`
  width: 13.5rem;
`;

const SignedAs = styled.p`
  font-size: var(--text-xs);
  color: var(--fg-muted);
  padding: var(--spacing-2) var(--spacing-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ThemeRadio = styled.span<{$active: boolean}>`
  background: ${({$active}) => ($active ? 'var(--fg)' : 'transparent')};
  border-color: ${({$active}) => ($active ? 'var(--fg)' : 'var(--fg)')};
  border-radius: 50%;
  border: 1.5px solid
    ${({$active}) => ($active ? 'var(--fg)' : 'var(--fg-muted)')};
  flex-shrink: 0;
  height: 0.5rem;
  margin-right: var(--spacing-2);
  width: 0.5rem;
`;
