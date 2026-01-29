import {useState} from 'react';
import {Button, Card, Loading} from '@play/pylon';
import {PageLayout} from '@/components/layout';
import type {Member} from '@/components/members';
import {InviteMemberOverlay, MembersTable} from '@/components/members';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

export function TeamSettingsPage() {
  const {activeOrganization, me} = useAppContext(
    ContextLevel.AuthenticatedWithOrg,
  );
  const [inviteOverlayOpen, setInviteOverlayOpen] = useState(false);
  const utils = trpc.useUtils();

  const {data: rawMembers = [], isLoading} = trpc.member.list.useQuery({
    organizationId: activeOrganization.id,
  });

  // Transform API response: profiles comes as array from Supabase join
  const members: Member[] = rawMembers.map((m) => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }));

  const canManage =
    activeOrganization.role === 'OWNER' || activeOrganization.role === 'ADMIN';
  const isOwner = activeOrganization.role === 'OWNER';

  const handleMembersChange = () => {
    utils.member.list.invalidate({organizationId: activeOrganization.id});
  };

  if (isLoading) {
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
        subtitle={`Manage team members of ${activeOrganization.name}`}
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
            organizationId={activeOrganization.id}
            currentUserId={me.id}
            canManage={canManage}
            isOwner={isOwner}
            onMembersChange={handleMembersChange}
          />
        </Card>
      </PageLayout.Content>

      <InviteMemberOverlay
        opened={inviteOverlayOpen}
        setOpened={setInviteOverlayOpen}
        organizationId={activeOrganization.id}
        existingMemberIds={members.map((m) => m.user_id)}
        canInviteOwner={isOwner}
        onSuccess={handleMembersChange}
      />
    </PageLayout>
  );
}
