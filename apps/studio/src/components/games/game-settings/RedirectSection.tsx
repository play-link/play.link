import {LinkIcon} from 'lucide-react';
import {useState} from 'react';
import {useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button, Input, useSnackbar} from '@play/pylon';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {trpc} from '@/lib/trpc';
import {Section, SectionTitle} from './shared';

export function RedirectSection() {
  const game = useOutletContext<GameOutletContext>();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);

  const pageConfig = (primaryPage?.page_config && typeof primaryPage.page_config === 'object' && !Array.isArray(primaryPage.page_config))
    ? (primaryPage.page_config as {redirectUrl?: string})
    : {};
  const currentRedirect = pageConfig.redirectUrl || '';

  const [redirectUrl, setRedirectUrl] = useState(currentRedirect);

  const updatePageConfig = trpc.gamePage.updatePageConfig.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
      showSnackbar({message: 'Redirect updated', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleSave = () => {
    if (!primaryPage) return;
    updatePageConfig.mutate({
      pageId: primaryPage.id,
      pageConfig: {redirectUrl: redirectUrl || null},
    });
  };

  if (!primaryPage) return null;

  return (
    <Section>
      <SectionTitle>Redirect Link</SectionTitle>
      <Description>
        Temporarily redirect visitors to an external URL (e.g. Steam Festival, Kickstarter).
        When set, anyone visiting your game page will be redirected instead of seeing the page.
      </Description>
      <Input
        label="Redirect URL"
        placeholder="https://store.steampowered.com/..."
        value={redirectUrl}
        onChange={(e) => setRedirectUrl(e.target.value)}
      />
      {currentRedirect && (
        <ActiveBadge>
          <LinkIcon size={14} />
          Currently redirecting visitors to this URL
        </ActiveBadge>
      )}
      <ButtonRow>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={redirectUrl === currentRedirect || updatePageConfig.isPending}
        >
          {currentRedirect ? 'Update redirect' : 'Set redirect'}
        </Button>
        {currentRedirect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRedirectUrl('');
              updatePageConfig.mutate({
                pageId: primaryPage.id,
                pageConfig: {redirectUrl: null},
              });
            }}
            disabled={updatePageConfig.isPending}
          >
            Remove redirect
          </Button>
        )}
      </ButtonRow>
    </Section>
  );
}

const Description = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
`;

const ActiveBadge = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-orange-500);
`;

const ButtonRow = styled.div`
  display: flex;
  gap: var(--spacing-2);
`;
