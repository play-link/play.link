import {TrashIcon} from 'lucide-react';
import {useCallback, useMemo, useState} from 'react';
import {Avatar, Badge, IconButton, Select, Table, useSnackbar} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib/trpc';

type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface MemberProfile {
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Member {
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

const ROLE_BADGE_INTENT: Record<MemberRole, 'info' | 'success' | 'warning'> = {
  OWNER: 'success',
  ADMIN: 'warning',
  MEMBER: 'info',
};

interface MembersTableProps {
  members: Member[];
  organizationId: string;
  currentUserId: string;
  canManage: boolean;
  isOwner: boolean;
  onMembersChange: () => void;
}

export function MembersTable({
  members,
  organizationId,
  currentUserId,
  canManage,
  isOwner,
  onMembersChange,
}: MembersTableProps) {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const {showSnackbar} = useSnackbar();

  const updateMember = trpc.member.update.useMutation({
    onMutate: ({userId}) => setUpdatingUserId(userId),
    onSettled: () => setUpdatingUserId(null),
    onSuccess: (_, {role}) => {
      onMembersChange();
      showSnackbar({message: `Role updated to ${role.toLowerCase()}`, severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const deleteMember = trpc.member.delete.useMutation({
    onSuccess: () => {
      onMembersChange();
      showSnackbar({message: 'Member removed', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleRoleChange = useCallback(
    (userId: string, newRole: MemberRole) => {
      updateMember.mutate({
        organizationId,
        userId,
        role: newRole,
      });
    },
    [organizationId, updateMember],
  );

  const handleRemoveMember = useCallback(
    (userId: string) => {
      // eslint-disable-next-line no-alert
      if (window.confirm('Are you sure you want to remove this member?')) {
        deleteMember.mutate({
          organizationId,
          userId,
        });
      }
    },
    [organizationId, deleteMember],
  );

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
              <p className="text-sm text-gray-500">{d.profiles.email}</p>
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
            canManage && d.user_id !== currentUserId && (isOwner || d.role !== 'OWNER');

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
            <Badge intent={ROLE_BADGE_INTENT[d.role as MemberRole]}>
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
          <span className="text-gray-500">{new Date(d.created_at).toLocaleDateString()}</span>
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
                const canRemove = d.user_id !== currentUserId && (isOwner || d.role !== 'OWNER');

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
      currentUserId,
      updatingUserId,
      deleteMember.isPending,
      handleRemoveMember,
      handleRoleChange,
    ],
  );

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <Table
        data={members}
        columns={columns}
        propertyForKey="user_id"
        emptyMessage="No members found"
        pagination={false}
      />
    </div>
  );
}
