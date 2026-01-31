import {ArrowLeftIcon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button, Input, useSnackbar} from '@play/pylon';
import type {GameOutletContext} from '@/pages/GamePage';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

export function CreateGameUpdate() {
  const game = useOutletContext<GameOutletContext>();
  const {activeOrganization} = useAppContext(ContextLevel.AuthenticatedWithOrg);
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();

  const basePath = `/${activeOrganization.slug}/games/${game.id}`;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');

  const createMutation = trpc.gameUpdate.create.useMutation({
    onSuccess: (data) => {
      showSnackbar({message: 'Update created', severity: 'success'});
      navigate(`${basePath}/updates/${data.id}`);
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !body.trim()) return;

    createMutation.mutate({
      gameId: game.id,
      title: title.trim(),
      body: body.trim(),
      ctaUrl: ctaUrl.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
    });
  }, [title, body, ctaUrl, ctaLabel, game.id, createMutation]);

  const canSubmit = title.trim() && body.trim() && !createMutation.isPending;

  return (
    <Container>
      <BackButton onClick={() => navigate(`${basePath}/updates`)}>
        <ArrowLeftIcon size={16} />
        Back to Updates
      </BackButton>

      <PageTitle>New Update</PageTitle>

      <FormCard>
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

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Update'}
        </Button>
      </FormCard>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--fg-muted);
  font-size: var(--text-sm);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.15s;

  &:hover {
    color: var(--fg);
  }
`;

const PageTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const FormCard = styled.div`
  max-width: 36rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
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
