import {ArrowLeftIcon, PencilIcon} from 'lucide-react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button, useSnackbar} from '@play/pylon';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {trpc} from '@/lib/trpc';
import {EditorPreview} from './EditorPreview';
import {EditorSidebar} from './EditorSidebar';
import type {EditableLink, EditableMedia, PageConfig} from './EditorSidebar';

type GameLink = Tables<'game_links'>;
type GameMedia = Tables<'game_media'>;

function toEditableLinks(links: GameLink[]): EditableLink[] {
  return links.map((l) => ({
    id: l.id,
    type: l.type,
    category: l.category,
    label: l.label,
    url: l.url,
    position: l.position,
  }));
}

function toEditableMedia(items: GameMedia[]): EditableMedia[] {
  return items.map((m) => ({
    id: m.id,
    type: m.type as 'image' | 'video',
    url: m.url,
    thumbnailUrl: m.thumbnail_url || m.url,
    position: m.position,
  }));
}

export function GameEditor() {
  const game = useOutletContext<GameOutletContext>();
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);

  const {data: serverLinks = []} = trpc.gameLink.list.useQuery({gameId: game.id});
  const {data: serverMedia = []} = trpc.gameMedia.list.useQuery({gameId: game.id});

  const initialConfig = useMemo<PageConfig>(
    () => (primaryPage?.page_config as PageConfig) ?? {},
    [primaryPage],
  );

  const [pageConfig, setPageConfig] = useState<PageConfig>(initialConfig);

  const initialDescription = (game.description as string) ?? '';
  const [description, setDescription] = useState(initialDescription);

  // Local links state — initialized from server, only saved on "Save changes"
  const initialLinksRef = useRef<EditableLink[]>([]);
  const [editLinks, setEditLinks] = useState<EditableLink[]>([]);
  const [linksInitialized, setLinksInitialized] = useState(false);

  useEffect(() => {
    if (serverLinks.length > 0 || !linksInitialized) {
      const editable = toEditableLinks(serverLinks);
      initialLinksRef.current = editable;
      setEditLinks(editable);
      setLinksInitialized(true);
    }
  }, [serverLinks, linksInitialized]);

  // Local media state — same pattern as links
  const initialMediaRef = useRef<EditableMedia[]>([]);
  const [editMedia, setEditMedia] = useState<EditableMedia[]>([]);
  const [mediaInitialized, setMediaInitialized] = useState(false);

  useEffect(() => {
    if (serverMedia.length > 0 || !mediaInitialized) {
      const editable = toEditableMedia(serverMedia);
      initialMediaRef.current = editable;
      setEditMedia(editable);
      setMediaInitialized(true);
    }
  }, [serverMedia, mediaInitialized]);

  const linksDirty = JSON.stringify(editLinks) !== JSON.stringify(initialLinksRef.current);
  const mediaDirty = JSON.stringify(editMedia) !== JSON.stringify(initialMediaRef.current);

  const isDirty =
    JSON.stringify(pageConfig) !== JSON.stringify(initialConfig) ||
    description !== initialDescription ||
    linksDirty ||
    mediaDirty;

  const updatePageConfig = trpc.gamePage.updatePageConfig.useMutation({
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const updateGame = trpc.game.update.useMutation({
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const createLink = trpc.gameLink.create.useMutation();
  const updateLink = trpc.gameLink.update.useMutation();
  const deleteLink = trpc.gameLink.delete.useMutation();

  const createMedia = trpc.gameMedia.create.useMutation();
  const updateMedia = trpc.gameMedia.update.useMutation();
  const deleteMedia = trpc.gameMedia.delete.useMutation();

  const isSaving = updatePageConfig.isPending || updateGame.isPending;

  const handleSave = useCallback(async () => {
    if (!primaryPage) return;

    try {
      const promises: Promise<unknown>[] = [];

      if (JSON.stringify(pageConfig) !== JSON.stringify(initialConfig)) {
        promises.push(
          updatePageConfig.mutateAsync({pageId: primaryPage.id, pageConfig}),
        );
      }
      if (description !== initialDescription) {
        promises.push(
          updateGame.mutateAsync({id: game.id, description}),
        );
      }

      // Diff links: find creates, updates, deletes
      if (linksDirty) {
        const initial = initialLinksRef.current;
        const initialIds = new Set(initial.map((l) => l.id));
        const currentIds = new Set(editLinks.map((l) => l.id));

        for (const link of initial) {
          if (!currentIds.has(link.id)) {
            promises.push(deleteLink.mutateAsync({id: link.id, gameId: game.id}));
          }
        }

        for (const link of editLinks) {
          if (link.id.startsWith('new-')) {
            promises.push(
              createLink.mutateAsync({
                gameId: game.id,
                category: link.category as 'store' | 'community' | 'media' | 'other',
                type: link.type as 'steam' | 'itch' | 'epic' | 'discord' | 'youtube' | 'website' | 'demo',
                label: link.label,
                url: link.url,
                position: link.position,
              }),
            );
          }
        }

        for (const link of editLinks) {
          if (link.id.startsWith('new-')) continue;
          if (!initialIds.has(link.id)) continue;
          const prev = initial.find((l) => l.id === link.id);
          if (prev && JSON.stringify(prev) !== JSON.stringify(link)) {
            promises.push(
              updateLink.mutateAsync({
                id: link.id,
                gameId: game.id,
                category: link.category as 'store' | 'community' | 'media' | 'other',
                type: link.type as 'steam' | 'itch' | 'epic' | 'discord' | 'youtube' | 'website' | 'demo',
                label: link.label,
                url: link.url,
                position: link.position,
              }),
            );
          }
        }
      }

      // Diff media: find creates, updates, deletes
      if (mediaDirty) {
        const initial = initialMediaRef.current;
        const initialIds = new Set(initial.map((m) => m.id));
        const currentIds = new Set(editMedia.map((m) => m.id));

        for (const item of initial) {
          if (!currentIds.has(item.id)) {
            promises.push(deleteMedia.mutateAsync({id: item.id, gameId: game.id}));
          }
        }

        for (const item of editMedia) {
          if (item.id.startsWith('new-')) {
            promises.push(
              createMedia.mutateAsync({
                gameId: game.id,
                type: item.type as 'image' | 'video',
                url: item.url,
                thumbnailUrl: item.thumbnailUrl || null,
                position: item.position,
              }),
            );
          }
        }

        for (const item of editMedia) {
          if (item.id.startsWith('new-')) continue;
          if (!initialIds.has(item.id)) continue;
          const prev = initial.find((m) => m.id === item.id);
          if (prev && JSON.stringify(prev) !== JSON.stringify(item)) {
            promises.push(
              updateMedia.mutateAsync({
                id: item.id,
                gameId: game.id,
                type: item.type as 'image' | 'video',
                url: item.url,
                thumbnailUrl: item.thumbnailUrl || null,
                position: item.position,
              }),
            );
          }
        }
      }

      await Promise.all(promises);
      utils.game.get.invalidate({id: game.id});
      utils.gameLink.list.invalidate({gameId: game.id});
      utils.gameMedia.list.invalidate({gameId: game.id});
      showSnackbar({message: 'Page saved', severity: 'success'});
    } catch (error) {
      showSnackbar({
        message: error instanceof Error ? error.message : 'Save failed',
        severity: 'error',
      });
    }
  }, [primaryPage, pageConfig, initialConfig, description, initialDescription, linksDirty, editLinks, mediaDirty, editMedia, updatePageConfig, updateGame, createLink, updateLink, deleteLink, createMedia, updateMedia, deleteMedia, game.id, utils, showSnackbar]);

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
              disabled={!isDirty || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </SidebarToolbar>

          <SidebarHeader>
            <EditorBadge>
              <PencilIcon size={14} />
              Page Editor
            </EditorBadge>
          </SidebarHeader>

          <EditorSidebar
            pageConfig={pageConfig}
            description={description}
            links={editLinks}
            media={editMedia}
            onChange={setPageConfig}
            onDescriptionChange={setDescription}
            onLinksChange={setEditLinks}
            onMediaChange={setEditMedia}
          />
        </Sidebar>

        <PreviewArea>
          <EditorPreview
            game={game}
            links={editLinks as unknown as GameLink[]}
            media={editMedia as unknown as GameMedia[]}
            pageConfig={pageConfig}
            description={description}
          />
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
