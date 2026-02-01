import {
  CheckIcon,
  FileTextIcon,
  LogOutIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Avatar, Button, DropdownMenu, Icon} from '@play/pylon';
import {CreateStudioDialog} from '@/components/layout/CreateStudioDialog';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {useAuth} from '@/lib/auth';

export function UserMenuDropdown() {
  const {me, activeStudio} = useAppContext(
    ContextLevel.AuthenticatedWithStudio,
  );
  const {signOut} = useAuth();
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

            <MenuDivider />

            <MenuSection>
              <MenuSectionTitle>Switch studio</MenuSectionTitle>
              {me.studios.map((studio) => (
                <Button
                  key={studio.id}
                  variant="menu"
                  onClick={() => handleStudioClick(studio.slug)}
                  className="w-full"
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
              >
                <Icon icon={PlusIcon} size={18} className="mr-3" />
                <span>New studio</span>
              </Button>
            </MenuSection>

            <MenuDivider />

            <Button variant="menu" className="w-full">
              <Icon icon={UserIcon} size={16} className="mr-3" />
              <span>Account settings</span>
            </Button>

            <MenuDivider />

            <Button variant="menu" className="w-full">
              <Icon icon={FileTextIcon} size={16} className="mr-3" />
              <span>Terms</span>
            </Button>

            <Button variant="menu" className="w-full">
              <Icon icon={ShieldCheckIcon} size={16} className="mr-3" />
              <span>Privacy</span>
            </Button>

            <MenuDivider />

            <Button variant="menu" onClick={signOut} className="w-full">
              <Icon icon={LogOutIcon} size={16} className="mr-3" />
              <span>Log out</span>
            </Button>
          </MenuContent>
        </DropdownMenu>
      </UserSection>

      <CreateStudioDialog opened={createStudioOpen} setOpened={setCreateStudioOpen} />
    </>
  );
}

const UserSection = styled.div`
  padding: var(--spacing-3);
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

const MenuDivider = styled.div`
  height: 1px;
  background: var(--border);
  margin: var(--spacing-1) 0;
`;
