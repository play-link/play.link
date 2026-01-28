import {TrashIcon} from 'lucide-react';
import {useCallback, useMemo, useState} from 'react';
import {Avatar, Badge, Button, IconButton, Loading, Select, Table, useSnackbar} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';
import {InviteMemberOverlay} from './members/InviteMemberOverlay';

type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface MemberProfile {
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Member {
  user_id: string;
  role: MemberRole;
  created_at: string;
  profiles: MemberProfile;
}

const ROLE_OPTIONS = [
  {label: 'Owner', value: 'OWNER'},
  {label: 'Admin', value: 'ADMIN'},
  {label: 'Member', value: 'MEMBER'},
];

const ROLE_BADGE_VARIANT: Record<MemberRole, 'primary' | 'secondary' | 'default'> = {
  OWNER: 'primary',
  ADMIN: 'secondary',
  MEMBER: 'default',
};

export function MembersPage() {
  const {activeOrganization, me} = useAppContext(ContextLevel.AuthenticatedWithOrg);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [inviteOverlayOpen, setInviteOverlayOpen] = useState(false);
  const {showSnackbar} = useSnackbar();

  const utils = trpc.useUtils();

  const {data: members = [], isLoading} = trpc.member.list.useQuery({
    organizationId: activeOrganization.id,
  });

  const updateMember = trpc.member.update.useMutation({
    onMutate: ({userId}) => setUpdatingUserId(userId),
    onSettled: () => setUpdatingUserId(null),
    onSuccess: (_, {role}) => {
      utils.member.list.invalidate({organizationId: activeOrganization.id});
      showSnackbar({message: `Role updated to ${role.toLowerCase()}`, severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const deleteMember = trpc.member.delete.useMutation({
    onSuccess: () => {
      utils.member.list.invalidate({organizationId: activeOrganization.id});
      showSnackbar({message: 'Member removed', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  // Check if current user can manage members
  const canManage = activeOrganization.role === 'OWNER' || activeOrganization.role === 'ADMIN';
  const isOwner = activeOrganization.role === 'OWNER';

  const handleRoleChange = useCallback((userId: string, newRole: MemberRole) => {
    updateMember.mutate({
      organizationId: activeOrganization.id,
      userId,
      role: newRole,
    });
  }, [activeOrganization.id, updateMember]);

  const handleRemoveMember = useCallback((userId: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to remove this member?')) {
      deleteMember.mutate({
        organizationId: activeOrganization.id,
        userId,
      });
    }
  }, [activeOrganization.id, deleteMember]);

  const columns: TableColumn<Member>[] = useMemo(
    () => [
      {
        title: 'Member',
        accessor: 'profiles.display_name',
        renderContent: ({d}) => (
          <div className="flex items-center gap-3">
            <Avatar
              text={d.profiles.display_name || d.profiles.email}
              src={d.profiles.avatar_url ?? undefined}
              size="sm"
            />
            <div>
              <p className="font-medium text-white">
                {d.profiles.display_name || d.profiles.username || 'Unknown'}
              </p>
              <p className="text-sm text-slate-400">{d.profiles.email}</p>
            </div>
          </div>
        ),
      },
      {
        title: 'Role',
        accessor: 'role',
        width: 150,
        renderContent: ({d}) => {
          const canChangeRole =
            canManage &&
            d.user_id !== me.id &&
            (isOwner || d.role !== 'OWNER');

          if (canChangeRole) {
            return (
              <Select
                options={isOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== 'OWNER')}
                value={d.role}
                onChange={(e) => handleRoleChange(d.user_id, e.target.value as MemberRole)}
                size="xs"
                variant="ghost"
                disabled={updatingUserId === d.user_id}
              />
            );
          }

          return (
            <Badge variant={ROLE_BADGE_VARIANT[d.role as MemberRole]}>
              {d.role.toLowerCase()}
            </Badge>
          );
        },
      },
      {
        title: 'Joined',
        accessor: 'created_at',
        width: 120,
        type: 'date',
        renderContent: ({d}) => (
          <span className="text-slate-400">
            {new Date(d.created_at).toLocaleDateString()}
          </span>
        ),
      },
      ...(canManage
        ? [
            {
              title: '',
              accessor: 'actions',
              width: 60,
              noSortable: true,
              renderContent: ({d}: {d: Member}) => {
                const canRemove =
                  d.user_id !== me.id && (isOwner || d.role !== 'OWNER');

                if (!canRemove) return null;

                return (
                  <IconButton
                    icon={TrashIcon}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(d.user_id)}
                    disabled={deleteMember.isPending}
                  />
                );
              },
            } as TableColumn<Member>,
          ]
        : []),
    ],
    [
      canManage,
      isOwner,
      me.id,
      updatingUserId,
      deleteMember.isPending,
      handleRemoveMember,
      handleRoleChange,
    ],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-slate-400 mt-1">
            Manage members of {activeOrganization.name}
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setInviteOverlayOpen(true)}>
            Invite Member
          </Button>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <Table
          data={members as Member[]}
          columns={columns}
          propertyForKey="user_id"
          emptyMessage="No members found"
          pagination={false}
        />
      </div>

      <InviteMemberOverlay
        opened={inviteOverlayOpen}
        setOpened={setInviteOverlayOpen}
        organizationId={activeOrganization.id}
        existingMemberIds={(members as Member[]).map((m) => m.user_id)}
        canInviteOwner={isOwner}
        onSuccess={() => utils.member.list.invalidate({organizationId: activeOrganization.id})}
      />
    </div>
  );
}
