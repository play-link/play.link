import {ArrowLeftIcon, PencilIcon} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button, useSnackbar} from '@play/pylon';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {trpc} from '@/lib/trpc';
import {EditorPreview} from './EditorPreview';
import {EditorSidebar} from './EditorSidebar';
import type {PageConfig} from './EditorSidebar';

export function GameEditor() {
  const game = useOutletContext<GameOutletContext>();
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);

  const {data: links = []} = trpc.gameLink.list.useQuery({gameId: game.id});

  const initialConfig = useMemo<PageConfig>(
    () => (primaryPage?.page_config as PageConfig) ?? {},
    [primaryPage],
  );

  const [pageConfig, setPageConfig] = useState<PageConfig>(initialConfig);

  const isDirty = JSON.stringify(pageConfig) !== JSON.stringify(initialConfig);

  const updatePageConfig = trpc.gamePage.updatePageConfig.useMutation({
    onSuccess: () => {
      utils.game.get.invalidate({id: game.id});
      showSnackbar({message: 'Page saved', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleSave = useCallback(() => {
    if (!primaryPage) return;
    updatePageConfig.mutate({
      pageId: primaryPage.id,
      pageConfig,
    });
  }, [primaryPage, pageConfig, updatePageConfig]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      // eslint-disable-next-line no-alert
      if (!confirm('You have unsaved changes. Discard and close?')) return;
    }
    navigate('..', {relative: 'path'});
  }, [isDirty, navigate]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <Fullscreen>
      <Layout>
        <Sidebar>
          <SidebarToolbar>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <ArrowLeftIcon size={16} />
              Back to game
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || updatePageConfig.isPending}
            >
              {updatePageConfig.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </SidebarToolbar>

          <SidebarHeader>
            <EditorBadge>
              <PencilIcon size={14} />
              Page Editor
            </EditorBadge>
          </SidebarHeader>

          <EditorSidebar pageConfig={pageConfig} onChange={setPageConfig} />
        </Sidebar>

        <PreviewArea>
          <EditorPreview game={game} links={links} pageConfig={pageConfig} />
        </PreviewArea>
      </Layout>
    </Fullscreen>
  );
}

const Fullscreen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg);
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  height: 100%;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-muted);
  overflow-y: auto;
  background: var(--bg-surface);
`;

const SidebarToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-muted);
  flex-shrink: 0;

  button {
    gap: var(--spacing-2);
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-4) 0;
`;

const EditorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: var(--bg-muted);
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--fg-muted);
`;

const PreviewArea = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
