import {useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import styled from 'styled-components';
import {z} from 'zod';
import {
  Avatar,
  Button,
  DialogOverlay,
  FieldsetController,
  Input,
  Select,
  useSnackbar,
} from '@play/pylon';
import {trpc} from '@/lib/trpc';
import type {SearchResult} from './UserSearchOverlay';
import {UserSearchOverlay} from './UserSearchOverlay';

const ROLE_OPTIONS = [
  {label: 'Member', value: 'MEMBER'},
  {label: 'Admin', value: 'ADMIN'},
  {label: 'Owner', value: 'OWNER'},
];

const inviteSchema = z.object({
  searchQuery: z.string().min(2, 'Enter at least 2 characters to search'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteMemberOverlayProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  studioId: string;
  existingMemberIds: string[];
  canInviteOwner: boolean;
  onSuccess: () => void;
}

export function InviteMemberOverlay({
  opened,
  setOpened,
  studioId,
  existingMemberIds,
  canInviteOwner,
  onSuccess,
}: InviteMemberOverlayProps) {
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const {showSnackbar} = useSnackbar();
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      searchQuery: '',
      role: 'MEMBER',
    },
  });

  const searchQuery = form.watch('searchQuery');

  const {data: searchResults = [], isLoading: isSearching} =
    trpc.profile.search.useQuery(
      {query: searchQuery},
      {
        enabled: searchQuery.length >= 2 && !selectedUser,
        staleTime: 1000,
      },
    );

  const addMember = trpc.member.create.useMutation({
    onSuccess: () => {
      showSnackbar({
        message: 'Member invited successfully',
        severity: 'success',
      });
      handleClose();
      onSuccess();
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const filteredResults = searchResults.filter(
    (user) => !existingMemberIds.includes(user.user_id),
  );

  const roleOptions = canInviteOwner
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r.value !== 'OWNER');

  const handleSelectUser = (user: SearchResult) => {
    setSelectedUser(user);
    setSearchValue(user.email);
    form.setValue('searchQuery', user.email);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchValue('');
    form.setValue('searchQuery', '');
  };

  const handleClose = () => {
    setOpened(false);
    setSelectedUser(null);
    setSearchValue('');
    form.reset();
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (!selectedUser) return;

    addMember.mutate({
      studioId,
      userId: selectedUser.user_id,
      role: data.role,
    });
  });

  return (
    <DialogOverlay
      opened={opened}
      setOpened={setOpened}
      size="md"
      as="form"
      onSubmit={handleSubmit}
    >
      <DialogOverlay.Header>Invite Member</DialogOverlay.Header>
      <DialogOverlay.Content>
        <Subtitle>Search for a user by email or username</Subtitle>
        <FormContent>
          <FieldsetController
            control={form.control}
            name="searchQuery"
            fieldsetProps={{label: 'Search user'}}
            render={({controlledProps}) => (
              <Input
                {...controlledProps}
                ref={inputRef}
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  controlledProps.onChange(e);
                  if (selectedUser) {
                    setSelectedUser(null);
                  }
                }}
                placeholder="Email or username..."
                autoComplete="off"
                className="w-full"
              />
            )}
          />

          <UserSearchOverlay
            opened={searchQuery.length >= 2 && !selectedUser}
            onClose={() => {
              setSearchValue('');
              form.setValue('searchQuery', '');
            }}
            isLoading={isSearching}
            results={filteredResults}
            onSelectUser={handleSelectUser}
            emptyMessage={
              searchResults.length > 0
                ? 'All matching users are already members'
                : 'No users found'
            }
            positionTarget={inputRef}
          />

          {selectedUser && (
            <SelectedUserCard>
              <Avatar
                text={selectedUser.display_name || selectedUser.email}
                src={selectedUser.avatar_url ?? undefined}
                size="md"
              />
              <SelectedUserInfo>
                <SelectedUserName>
                  {selectedUser.display_name ||
                    selectedUser.username ||
                    'Unknown'}
                </SelectedUserName>
                <SelectedUserEmail>{selectedUser.email}</SelectedUserEmail>
              </SelectedUserInfo>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                Change
              </Button>
            </SelectedUserCard>
          )}

          <FieldsetController
            control={form.control}
            name="role"
            fieldsetProps={{label: 'Role'}}
            render={({controlledProps}) => (
              <Select {...controlledProps} options={roleOptions} fullWidth />
            )}
          />
        </FormContent>
      </DialogOverlay.Content>
      <DialogOverlay.Footer>
        <Button type="button" variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!selectedUser || addMember.isPending}
        >
          {addMember.isPending ? 'Inviting...' : 'Invite'}
        </Button>
      </DialogOverlay.Footer>
    </DialogOverlay>
  );
}

const Subtitle = styled.p`
  margin-bottom: var(--spacing-4);
`;

const FormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const SelectedUserCard = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--bg-hover);
  border-radius: var(--radius-lg);
`;

const SelectedUserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SelectedUserName = styled.p`
  font-weight: var(--font-weight-medium);
  color: var(--white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SelectedUserEmail = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
