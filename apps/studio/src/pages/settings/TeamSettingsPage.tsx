import {useState} from 'react';
import {Button, Card, Loading} from '@play/pylon';
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

  const {data: rawMembers = [], isLoading} = trpc.member.list.useQuery({
    studioId: activeStudio.id,
  });

  // Transform API response: profiles comes as array from Supabase join
  const members: Member[] = rawMembers.map((m) => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }));

  const canManage =
    activeStudio.role === 'OWNER' || activeStudio.role === 'ADMIN';
  const isOwner = activeStudio.role === 'OWNER';

  const handleMembersChange = () => {
    utils.member.list.invalidate({studioId: activeStudio.id});
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
      </PageLayout.Content>

      <InviteMemberOverlay
        opened={inviteOverlayOpen}
        setOpened={setInviteOverlayOpen}
        studioId={activeStudio.id}
        existingMemberIds={members.map((m) => m.user_id)}
        canInviteOwner={isOwner}
        onSuccess={handleMembersChange}
      />
    </PageLayout>
  );
}
