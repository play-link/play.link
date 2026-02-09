import {
  CheckIcon,
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
  DropdownMenu,
  Icon,
  SegmentedControls,
  useTheme,
} from '@play/pylon';
import type {Theme} from '@play/pylon';
import {CreateStudioDialog} from '@/components/layout/CreateStudioDialog';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {useAuth} from '@/lib/auth';

const themeItems = [
  {value: 'light', icon: <SunIcon size={14} />},
  {value: 'system', icon: <MonitorIcon size={14} />},
  {value: 'dark', icon: <MoonIcon size={14} />},
];

export function UserMenuDropdown() {
  const {me, activeStudio} = useAppContext(
    ContextLevel.AuthenticatedWithStudio,
  );
  const {signOut} = useAuth();
  const {theme, setTheme} = useTheme();
  const navigate = useNavigate();
  const [createStudioOpen, setCreateStudioOpen] = useState(false);

  const displayName = me.displayName || me.email.split('@')[0];

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
            verticalOffset: 8,
          }}
          closeOnClickSelectors={['[data-close-menu]']}
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

            <MenuDivider />

            <MenuSection>
              <MenuSectionTitle>Switch studio</MenuSectionTitle>
              {me.studios.map((studio) => (
                <Button
                  key={studio.id}
                  variant="menu"
                  onClick={() => handleStudioClick(studio.slug)}
                  className="w-full"
                  data-close-menu
                >
                  {studio.id === activeStudio.id && (
                    <Icon icon={CheckIcon} size={16} className="mr-3" />
                  )}
                  <span>{studio.name}</span>
                </Button>
              ))}
              <Button
                variant="menu"
                onClick={() => setCreateStudioOpen(true)}
                className="w-full text-fg-muted"
                data-close-menu
              >
                <Icon icon={PlusIcon} size={18} className="mr-3" />
                <span>New studio</span>
              </Button>
            </MenuSection>

            <MenuDivider />

            <Button variant="menu" className="w-full" data-close-menu>
              <Icon icon={UserIcon} size={16} className="mr-3" />
              <span>Account settings</span>
            </Button>

            <MenuDivider />

            <ThemeSection>
              <ThemeLabel>Theme</ThemeLabel>
              <SegmentedControls
                items={themeItems}
                value={theme}
                onChange={(item) => setTheme(item.value as Theme)}
                size="sm"
              />
            </ThemeSection>

            <MenuDivider />

            <Button variant="menu" className="w-full" data-close-menu>
              <Icon icon={FileTextIcon} size={16} className="mr-3" />
              <span>Terms</span>
            </Button>

            <Button variant="menu" className="w-full" data-close-menu>
              <Icon icon={ShieldCheckIcon} size={16} className="mr-3" />
              <span>Privacy</span>
            </Button>

            <MenuDivider />

            <Button
              variant="menu"
              onClick={signOut}
              className="w-full"
              data-close-menu
            >
              <Icon icon={LogOutIcon} size={16} className="mr-3" />
              <span>Log out</span>
            </Button>
          </MenuContent>
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
  color: var(--fg);
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

const MenuDivider = styled.div`
  height: 1px;
  background: var(--border);
  margin: var(--spacing-1) 0;
`;

const ThemeSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
`;

const ThemeLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;
