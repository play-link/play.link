import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import styled from 'styled-components';
import {z} from 'zod';
import {
  Button,
  DialogOverlay,
  FieldsetController,
  Input,
  Select,
  useSnackbar,
} from '@play/pylon';
import {trpc} from '@/lib/trpc';

const ROLE_OPTIONS = [
  {label: 'Member', value: 'MEMBER'},
  {label: 'Viewer', value: 'VIEWER'},
  {label: 'Owner', value: 'OWNER'},
];

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['OWNER', 'MEMBER', 'VIEWER']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteMemberOverlayProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  studioId: string;
  canInviteOwner: boolean;
  onSuccess: () => void;
}

export function InviteMemberOverlay({
  opened,
  setOpened,
  studioId,
  canInviteOwner,
  onSuccess,
}: InviteMemberOverlayProps) {
  const {showSnackbar} = useSnackbar();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER',
    },
  });

  const createInvite = trpc.invite.create.useMutation({
    onSuccess: () => {
      showSnackbar({
        message: 'Invitation sent successfully',
        severity: 'success',
      });
      handleClose();
      onSuccess();
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const roleOptions = canInviteOwner
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r.value !== 'OWNER');

  const handleClose = () => {
    setOpened(false);
    form.reset();
  };

  const handleSubmit = form.handleSubmit((data) => {
    createInvite.mutate({
      studioId,
      email: data.email,
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
        <Subtitle>
          Enter the email address of the person you want to invite
        </Subtitle>
        <FormContent>
          <FieldsetController
            control={form.control}
            name="email"
            fieldsetProps={{label: 'Email address'}}
            render={({controlledProps}) => (
              <Input
                {...controlledProps}
                type="email"
                placeholder="name@example.com"
                autoComplete="off"
                className="w-full"
              />
            )}
          />

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
          disabled={createInvite.isPending}
        >
          {createInvite.isPending ? 'Sending...' : 'Send Invitation'}
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
