import {CopyIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Button, Loading, useSnackbar} from '@play/pylon';
import {PageLayout} from '@/components/layout';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';
import {CreateCampaignDialog} from './CreateCampaignPage';

export function CampaignsPage() {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {data: campaigns = [], isLoading} = trpc.campaign.listByStudio.useQuery({
    studioId: activeStudio.id,
  });

  const deleteMutation = trpc.campaign.delete.useMutation({
    onSuccess: () => {
      utils.campaign.listByStudio.invalidate({
        studioId: activeStudio.id,
      });
      showSnackbar({message: 'Campaign deleted', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleDelete = (id: string, gameId: string, name: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return;
    deleteMutation.mutate({id, gameId});
  };

  const copyLink = (slug: string, gameSlug: string) => {
    const url = `https://play.link/g/${gameSlug}?c=${slug}`;
    navigator.clipboard.writeText(url);
    showSnackbar({message: 'Link copied', severity: 'success'});
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Header title="Campaigns" />
        <PageLayout.Content>
          <LoadingContainer>
            <Loading size="lg" />
          </LoadingContainer>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header title="Campaigns">
        <Button variant="primary" onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon size={18} className="mr-2" />
          Create Campaign
        </Button>
      </PageLayout.Header>

      <PageLayout.Content>
        {campaigns.length === 0 ? (
          <EmptyState>
            <EmptyImage src="/assets/no-campaigns.png" alt="" />
            <EmptyTitle>No campaigns yet</EmptyTitle>
            <EmptyText>
              Create your first campaign to start tracking performance.
            </EmptyText>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <Tr>
                <Th>Name</Th>
                <Th>Game</Th>
                <Th>Destination</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th style={{width: '6rem'}} />
              </Tr>
            </thead>
            <tbody>
              {campaigns.map((c: any) => (
                <Tr
                  key={c.id}
                  onClick={() =>
                    navigate(`/${activeStudio.slug}/campaigns/${c.id}`)
                  }
                  style={{cursor: 'pointer'}}
                >
                  <Td>
                    <CampaignName>{c.name}</CampaignName>
                    <CampaignSlug>?c={c.slug}</CampaignSlug>
                  </Td>
                  <Td>{c.game_title}</Td>
                  <Td>
                    <DestinationLabel>
                      {c.destination === 'game_page'
                        ? 'Game page'
                        : c.destination}
                    </DestinationLabel>
                  </Td>
                  <Td>
                    <StatusBadge $active={c.status === 'active'}>
                      {c.status}
                    </StatusBadge>
                  </Td>
                  <Td>
                    {new Date(c.created_at).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Td>
                  <Td>
                    <Actions onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(c.slug, c.game_slug)}
                        title="Copy link"
                      >
                        <CopyIcon size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id, c.game_id, c.name)}
                        title="Delete"
                      >
                        <Trash2Icon size={14} />
                      </Button>
                    </Actions>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </PageLayout.Content>

      <CreateCampaignDialog
        opened={createDialogOpen}
        setOpened={setCreateDialogOpen}
      />
    </PageLayout>
  );
}

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-16) var(--spacing-6);
`;

const EmptyImage = styled.img`
  width: 27.5rem;
  margin-bottom: var(--spacing-8);
`;

const EmptyTitle = styled.h2`
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin-bottom: var(--spacing-2);
`;

const EmptyText = styled.p`
  color: var(--fg-muted);
  margin: 0 0 var(--spacing-6);
  max-width: 24rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  overflow: hidden;
`;

const Tr = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid var(--border-muted);
  }

  tbody &:hover {
    background: var(--bg-muted);
  }
`;

const Th = styled.th`
  text-align: left;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Td = styled.td`
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--text-sm);
  color: var(--fg);
`;

const CampaignName = styled.div`
  font-weight: var(--font-weight-medium);
`;

const CampaignSlug = styled.div`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  font-family: var(--font-mono, monospace);
`;

const DestinationLabel = styled.span`
  text-transform: capitalize;
`;

const StatusBadge = styled.span<{$active: boolean}>`
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
  background: ${({$active}) =>
    $active ? 'var(--color-success-100, #dcfce7)' : 'var(--bg-muted)'};
  color: ${({$active}) =>
    $active ? 'var(--color-success-700, #15803d)' : 'var(--fg-muted)'};
`;

const Actions = styled.div`
  display: flex;
  gap: var(--spacing-1);
`;
