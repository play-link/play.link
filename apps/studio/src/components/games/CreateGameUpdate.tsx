import {useCallback, useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Button, DialogOverlay, Input, useSnackbar} from '@play/pylon';
import type {GameOutletContext} from '@/pages/GamePage';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

interface CreateGameUpdateProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  game: GameOutletContext;
}

export function CreateGameUpdate({opened, setOpened, game}: CreateGameUpdateProps) {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();

  const basePath = `/${activeStudio.slug}/games/${game.id}`;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');

  const createMutation = trpc.gameUpdate.create.useMutation({
    onSuccess: (data) => {
      showSnackbar({message: 'Update created', severity: 'success'});
      handleClose();
      navigate(`${basePath}/updates/${data.id}`);
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleClose = () => {
    setOpened(false);
    setTitle('');
    setBody('');
    setCtaUrl('');
    setCtaLabel('');
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !body.trim()) return;

      createMutation.mutate({
        gameId: game.id,
        title: title.trim(),
        body: body.trim(),
        ctaUrl: ctaUrl.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
      });
    },
    [title, body, ctaUrl, ctaLabel, game.id, createMutation],
  );

  const canSubmit = title.trim() && body.trim() && !createMutation.isPending;

  return (
    <DialogOverlay
      opened={opened}
      setOpened={setOpened}
      size="md"
      as="form"
      onSubmit={handleSubmit}
    >
      <DialogOverlay.Header>New Update</DialogOverlay.Header>
      <DialogOverlay.Content>
        <FormContent>
          <FormSection>
            <Label>Title</Label>
            <Input
              placeholder="e.g. Patch 1.2 Notes, Launch Date Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormSection>

          <FormSection>
            <Label>Body</Label>
            <Textarea
              placeholder="Write your update content here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
            />
            <Hint>Plain text. Line breaks are preserved.</Hint>
          </FormSection>

          <Divider />

          <SectionHeading>Call to Action (optional)</SectionHeading>

          <FormRow>
            <FormSection>
              <Label>Button label</Label>
              <Input
                placeholder="e.g. Wishlist on Steam"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
              />
            </FormSection>
            <FormSection>
              <Label>Button URL</Label>
              <Input
                placeholder="https://store.steampowered.com/app/..."
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
              />
            </FormSection>
          </FormRow>
        </FormContent>
      </DialogOverlay.Content>
      <DialogOverlay.Footer>
        <Button type="button" variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Update'}
        </Button>
      </DialogOverlay.Footer>
    </DialogOverlay>
  );
}

const FormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
`;

const Label = styled.label`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg);
`;

const Hint = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
`;

const SectionHeading = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  margin: 0;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border-muted);
  margin: 0;
`;

const Textarea = styled.textarea`
  background: var(--bg-input);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-sm);
  color: var(--fg);
  font-family: inherit;
  resize: vertical;
  min-height: 8rem;
  line-height: 1.5;

  &::placeholder {
    color: var(--fg-subtle);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
  }
`;
