import {useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Button, Input, useSnackbar} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';
import {Section, SectionTitle} from './shared';

interface DangerZoneSectionProps {
  gameId: string;
  gameTitle: string;
}

export function DangerZoneSection({gameId, gameTitle}: DangerZoneSectionProps) {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const {showSnackbar} = useSnackbar();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteGame = trpc.game.delete.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Game deleted', severity: 'success'});
      navigate(`/${activeStudio.slug}/games`);
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleDelete = () => {
    if (confirmText !== gameTitle) return;
    deleteGame.mutate({id: gameId});
  };

  return (
    <DangerSection>
      <SectionTitle>Danger Zone</SectionTitle>

      <DangerItem>
        <DangerInfo>
          <DangerTitle>Delete this game</DangerTitle>
          <DangerDescription>
            Once you delete a game, there is no going back. This will
            permanently remove all game data, credits, and associated content.
          </DangerDescription>
        </DangerInfo>

        {!showDeleteConfirm ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete game
          </Button>
        ) : (
          <DeleteConfirm>
            <p className="text-sm text-(--fg-muted)">
              Type <strong>{gameTitle}</strong> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={gameTitle}
              size="sm"
            />
            <DeleteConfirmActions>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={confirmText !== gameTitle || deleteGame.isPending}
              >
                {deleteGame.isPending
                  ? 'Deleting...'
                  : 'I understand, delete this game'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText('');
                }}
              >
                Cancel
              </Button>
            </DeleteConfirmActions>
          </DeleteConfirm>
        )}
      </DangerItem>
    </DangerSection>
  );
}

const DangerSection = styled(Section)`
  border: 1px solid var(--color-red-900);
  border-radius: var(--radius-lg);
  padding: var(--spacing-5);
`;

const DangerItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
`;

const DangerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const DangerTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
`;

const DangerDescription = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
`;

const DeleteConfirm = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const DeleteConfirmActions = styled.div`
  display: flex;
  gap: var(--spacing-2);
`;
