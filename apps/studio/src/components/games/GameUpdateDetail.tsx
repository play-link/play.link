import {ArrowLeftIcon, SendIcon, Trash2Icon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {useNavigate, useOutletContext, useParams} from 'react-router';
import styled from 'styled-components';
import {Button, Input, Loading, useSnackbar} from '@play/pylon';
import type {GameOutletContext} from '@/pages/GamePage';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

export function GameUpdateDetail() {
  const game = useOutletContext<GameOutletContext>();
  const {updateId} = useParams<{updateId: string}>();
  const {activeOrganization} = useAppContext(ContextLevel.AuthenticatedWithOrg);
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();

  const basePath = `/${activeOrganization.slug}/games/${game.id}`;

  const {data: update, isLoading} = trpc.gameUpdate.get.useQuery(
    {id: updateId!, gameId: game.id},
    {enabled: !!updateId},
  );

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  // Initialize form fields when data loads
  if (update && !initialized) {
    setTitle(update.title);
    setBody(update.body);
    setCtaUrl(update.cta_url || '');
    setCtaLabel(update.cta_label || '');
    setInitialized(true);
  }

  const updateMutation = trpc.gameUpdate.update.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Update saved', severity: 'success'});
      utils.gameUpdate.get.invalidate({id: updateId!, gameId: game.id});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const publishMutation = trpc.gameUpdate.publish.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Update published', severity: 'success'});
      setShowPublishModal(false);
      utils.gameUpdate.get.invalidate({id: updateId!, gameId: game.id});
      utils.gameUpdate.list.invalidate({gameId: game.id});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const deleteMutation = trpc.gameUpdate.delete.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Update deleted', severity: 'success'});
      navigate(`${basePath}/updates`);
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleSave = useCallback(() => {
    if (!title.trim() || !body.trim() || !updateId) return;

    updateMutation.mutate({
      id: updateId,
      gameId: game.id,
      title: title.trim(),
      body: body.trim(),
      ctaUrl: ctaUrl.trim() || null,
      ctaLabel: ctaLabel.trim() || null,
    });
  }, [title, body, ctaUrl, ctaLabel, updateId, game.id, updateMutation]);

  const handlePublish = useCallback(() => {
    if (!updateId) return;
    publishMutation.mutate({
      id: updateId,
      gameId: game.id,
      sendEmail,
    });
  }, [updateId, game.id, sendEmail, publishMutation]);

  const handleDelete = useCallback(() => {
    // eslint-disable-next-line no-alert
    if (!updateId || !window.confirm('Are you sure you want to delete this update?')) return;
    deleteMutation.mutate({id: updateId, gameId: game.id});
  }, [updateId, game.id, deleteMutation]);

  if (isLoading || !update) {
    return (
      <LoadingContainer>
        <Loading size="lg" />
      </LoadingContainer>
    );
  }

  const isDraft = update.status === 'draft';
  const canSave = isDraft && title.trim() && body.trim() && !updateMutation.isPending;

  return (
    <Container>
      <TopBar>
        <BackButton onClick={() => navigate(`${basePath}/updates`)}>
          <ArrowLeftIcon size={16} />
          Back to Updates
        </BackButton>
        <TopBarActions>
          {isDraft && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPublishModal(true)}
            >
              <SendIcon size={14} />
              Publish
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2Icon size={14} />
          </Button>
        </TopBarActions>
      </TopBar>

      <HeaderRow>
        <PageTitle>{isDraft ? 'Edit Update' : 'Update Detail'}</PageTitle>
        <StatusBadge $status={update.status}>{update.status}</StatusBadge>
      </HeaderRow>

      {!isDraft && (
        <PublishedInfo>
          Published on{' '}
          {new Date(update.published_at).toLocaleDateString('en', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          {update.sent_count > 0 && ` · Sent to ${update.sent_count} subscribers`}
        </PublishedInfo>
      )}

      <FormCard>
        <FormSection>
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isDraft}
          />
        </FormSection>

        <FormSection>
          <Label>Body</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            disabled={!isDraft}
          />
        </FormSection>

        <Divider />

        <SectionHeading>Call to Action</SectionHeading>

        <FormRow>
          <FormSection>
            <Label>Button label</Label>
            <Input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="e.g. Wishlist on Steam"
              disabled={!isDraft}
            />
          </FormSection>
          <FormSection>
            <Label>Button URL</Label>
            <Input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://..."
              disabled={!isDraft}
            />
          </FormSection>
        </FormRow>

        {isDraft && (
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Draft'}
          </Button>
        )}
      </FormCard>

      {showPublishModal && (
        <ModalOverlay onClick={() => setShowPublishModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Publish Update</ModalTitle>
            <ModalText>
              This will make the update visible on your game page. This action cannot be undone.
            </ModalText>

            <CheckboxRow>
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              <label htmlFor="sendEmail">
                Send email to subscribers
              </label>
            </CheckboxRow>

            <ModalActions>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPublishModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? 'Publishing...' : 'Publish'}
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24rem;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TopBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
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

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const PageTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const StatusBadge = styled.span<{$status: string}>`
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: capitalize;
  background: ${({$status}) =>
    $status === 'published'
      ? 'color-mix(in srgb, var(--color-success-500) 15%, transparent)'
      : 'color-mix(in srgb, var(--fg-muted) 15%, transparent)'};
  color: ${({$status}) =>
    $status === 'published' ? 'var(--color-success-500)' : 'var(--fg-muted)'};
`;

const PublishedInfo = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-subtle);
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  max-width: 28rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const ModalTitle = styled.h3`
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const ModalText = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
  line-height: 1.5;
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: var(--fg);

  input {
    accent-color: var(--color-primary-500);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
`;
