import {
  CheckIcon,
  CircleIcon,
  FileTextIcon,
  LogOutIcon,
  PlusIcon,
  UserIcon,
} from 'lucide-react';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Avatar, Button, Divider, DropdownMenu, Icon} from '@play/pylon';
import {CreateOrgDialog} from '@/components/layout/CreateOrgDialog';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {useAuth} from '@/lib/auth';

export function UserMenuDropdown() {
  const {me, activeOrganization} = useAppContext(
    ContextLevel.AuthenticatedWithOrg,
  );
  const {signOut} = useAuth();
  const navigate = useNavigate();
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const displayName = me.displayName || me.email.split('@')[0];

  const handleOrgClick = (slug: string) => {
    if (slug !== activeOrganization.slug) {
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

      <CreateOrgDialog opened={createOrgOpen} setOpened={setCreateOrgOpen} />
    </>
  );
}

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
