import {useState} from 'react';
import {Button, Card, Loading, useSnackbar} from '@play/pylon';
import styled from 'styled-components';
import {PageLayout} from '@/components/layout';
import type {Member} from '@/components/members';
import {InviteMemberOverlay, MembersTable} from '@/components/members';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

export function TeamSettingsPage() {
  const {activeStudio, me} = useAppContext(
    ContextLevel.AuthenticatedWithStudio,
  );
  const [inviteOverlayOpen, setInviteOverlayOpen] = useState(false);
  const utils = trpc.useUtils();
  const {showSnackbar} = useSnackbar();

  const {data: rawMembers = [], isLoading: membersLoading} =
    trpc.member.list.useQuery({
      studioId: activeStudio.id,
    });

  const {data: pendingInvites = []} = trpc.invite.list.useQuery(
      {studioId: activeStudio.id},
      {enabled: activeStudio.role === 'OWNER'},
    );

  const deleteInvite = trpc.invite.delete.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Invitation cancelled', severity: 'success'});
      utils.invite.list.invalidate({studioId: activeStudio.id});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  // Transform API response: profiles comes as array from Supabase join
  const members: Member[] = rawMembers.map((m) => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }));

  // Only owners can manage team members (invite, remove, change roles)
  const isOwner = activeStudio.role === 'OWNER';
  const canManage = isOwner;

  const handleMembersChange = () => {
    utils.member.list.invalidate({studioId: activeStudio.id});
    utils.invite.list.invalidate({studioId: activeStudio.id});
  };

  const handleCancelInvite = (inviteId: number) => {
    deleteInvite.mutate({id: inviteId});
  };

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header
        title="Team"
        subtitle={`Manage team members of ${activeStudio.name}`}
      >
        {canManage && (
          <Button variant="primary" onClick={() => setInviteOverlayOpen(true)}>
            Invite Member
          </Button>
        )}
      </PageLayout.Header>

      <PageLayout.Content>
        <Card padding={0}>
          <MembersTable
            members={members}
            studioId={activeStudio.id}
            currentUserId={me.id}
            canManage={canManage}
            isOwner={isOwner}
            onMembersChange={handleMembersChange}
          />
        </Card>

        {isOwner && pendingInvites.length > 0 && (
          <PendingInvitesSection>
            <SectionTitle>Pending Invitations</SectionTitle>
            <Card padding={0}>
              <InvitesList>
                {pendingInvites.map((invite) => (
                  <InviteRow key={invite.id}>
                    <InviteInfo>
                      <InviteEmail>{invite.email}</InviteEmail>
                      <InviteMeta>
                        <RoleBadge $role={invite.role}>{invite.role}</RoleBadge>
                        <span>
                          Sent{' '}
                          {new Date(invite.created_at).toLocaleDateString()}
                        </span>
                      </InviteMeta>
                    </InviteInfo>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvite(invite.id)}
                      disabled={deleteInvite.isPending}
                    >
                      Cancel
                    </Button>
                  </InviteRow>
                ))}
              </InvitesList>
            </Card>
          </PendingInvitesSection>
        )}
      </PageLayout.Content>

      <InviteMemberOverlay
        opened={inviteOverlayOpen}
        setOpened={setInviteOverlayOpen}
        studioId={activeStudio.id}
        canInviteOwner={isOwner}
        onSuccess={handleMembersChange}
      />
    </PageLayout>
  );
}

const PendingInvitesSection = styled.div`
  margin-top: var(--spacing-6);
`;

const SectionTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--white);
  margin-bottom: var(--spacing-3);
`;

const InvitesList = styled.div`
  display: flex;
  flex-direction: column;
`;

const InviteRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-muted);

  &:last-child {
    border-bottom: none;
  }
`;

const InviteInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const InviteEmail = styled.span`
  font-weight: var(--font-weight-medium);
  color: var(--white);
`;

const InviteMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: var(--fg-subtle);
`;

const RoleBadge = styled.span<{$role: string}>`
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  background: ${({$role}) =>
    $role === 'OWNER'
      ? 'var(--color-success-500)'
      : $role === 'MEMBER'
        ? 'var(--color-primary-500)'
        : 'var(--color-warning-500)'};
  color: var(--white);
`;
