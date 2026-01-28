import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {css} from 'styled-components';
import {z} from 'zod';
import {
  Avatar,
  Button,
  FieldsetController,
  Form,
  Input,
  Loading,
  Overlay,
  Select,
  useSnackbar,
} from '@play/pylon';
import {trpc} from '@/lib/trpc';

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

interface SearchResult {
  user_id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface InviteMemberOverlayProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  organizationId: string;
  existingMemberIds: string[];
  canInviteOwner: boolean;
  onSuccess: () => void;
}

export function InviteMemberOverlay({
  opened,
  setOpened,
  organizationId,
  existingMemberIds,
  canInviteOwner,
  onSuccess,
}: InviteMemberOverlayProps) {
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const {showSnackbar} = useSnackbar();

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
      organizationId,
      userId: selectedUser.user_id,
      role: data.role,
    });
  });

  return (
    <Overlay
      opened={opened}
      setOpened={setOpened}
      cancelOnEscKey
      cancelOnOutsideClick
      withBackdrop
      position={{mode: 'centered'}}
      modalCss={css`
        background: var(--bg-overlay);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-soft);
        box-shadow: var(--shadow-xl);
        max-width: 28rem;
        padding: var(--spacing-6);
        width: 100%;
      `}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Invite Member</h2>
          <p className="text-sm text-slate-400 mt-1">
            Search for a user by email or username
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Search Input */}
            <FieldsetController
              control={form.control}
              name="searchQuery"
              fieldsetProps={{label: 'Search user'}}
              render={({controlledProps}) => (
                <div className="relative">
                  <Input
                    {...controlledProps}
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
                  />

                  {/* Search Results Dropdown */}
                  {searchQuery.length >= 2 && !selectedUser && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="flex items-center justify-center p-4">
                          <Loading size="sm" />
                        </div>
                      ) : filteredResults.length === 0 ? (
                        <div className="p-3 text-sm text-slate-400">
                          {searchResults.length > 0
                            ? 'All matching users are already members'
                            : 'No users found'}
                        </div>
                      ) : (
                        filteredResults.map((user) => (
                          <button
                            key={user.user_id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors text-left"
                          >
                            <Avatar
                              text={user.display_name || user.email}
                              src={user.avatar_url ?? undefined}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {user.display_name ||
                                  user.username ||
                                  'Unknown'}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {user.email}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            />

            {/* Selected User Display */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                <Avatar
                  text={selectedUser.display_name || selectedUser.email}
                  src={selectedUser.avatar_url ?? undefined}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {selectedUser.display_name ||
                      selectedUser.username ||
                      'Unknown'}
                  </p>
                  <p className="text-sm text-slate-400 truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                >
                  Change
                </Button>
              </div>
            )}

            {/* Role Select */}
            <FieldsetController
              control={form.control}
              name="role"
              fieldsetProps={{label: 'Role'}}
              render={({controlledProps}) => (
                <Select {...controlledProps} options={roleOptions} fullWidth />
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
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
            </div>
          </div>
        </Form>
      </div>
    </Overlay>
  );
}
