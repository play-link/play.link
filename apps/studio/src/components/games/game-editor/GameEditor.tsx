import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router';
import styled from 'styled-components';
import {useSnackbar} from '@play/pylon';
import {trpc} from '@/lib/trpc';
import type {GameOutletContext} from '@/pages/GamePage';
import {EditorPreview} from './EditorPreview';
import {EditorSidebar} from './EditorSidebar';
import {EditorPreviewContainer} from './components/EditorPreviewContainer';
import {EditorToolbar} from './components/EditorToolbar';
import {useEditableCollection} from './hooks/use-editable-collection';
import {useEditorShortcuts} from './hooks/use-editor-shortcuts';
import type {
  EditableLink,
  EditableMedia,
  EditorSnapshot,
  GameMetadata,
  PageConfig,
} from './types';
import {diffEditableItems, hashValue, toEditableLinks, toEditableMedia} from './utils';
import {useUndoRedo} from './use-undo-redo';

type LinkCategory = 'store' | 'community' | 'media' | 'other' | 'platform';

function toLinkMutationInput(link: EditableLink) {
  return {
    category: link.category as LinkCategory,
    type: link.type as any,
    label: link.label,
    url: link.url || null,
    position: link.position,
    comingSoon: link.comingSoon,
  };
}

function toMediaMutationInput(item: EditableMedia) {
  return {
    type: item.type as 'image' | 'video',
    url: item.url,
    thumbnailUrl: item.thumbnailUrl || null,
    position: item.position,
  };
}

export function GameEditor() {
  const game = useOutletContext<GameOutletContext>();
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();

  const pages = (game.pages ?? []) as {id: string; is_primary: boolean; page_config: unknown}[];
  const primaryPage = pages.find((page) => page.is_primary);

  const linksQuery = trpc.gameLink.list.useQuery({gameId: game.id});
  const mediaQuery = trpc.gameMedia.list.useQuery({gameId: game.id});

  const initialConfig = useMemo<PageConfig>(
    () => (primaryPage?.page_config as PageConfig) ?? {},
    [primaryPage],
  );
  const initialDescription = (game.about_the_game as string) ?? '';
  const initialMetadata = useMemo<GameMetadata>(
    () => ({
      title: game.title,
      coverUrl: (game.cover_url as string) || '',
      headerUrl: (game.header_url as string) || '',
      trailerUrl: (game.trailer_url as string) || '',
    }),
    [game.cover_url, game.header_url, game.title, game.trailer_url],
  );

  const initialConfigRef = useRef<PageConfig>(initialConfig);
  const initialDescriptionRef = useRef(initialDescription);
  const initialMetadataRef = useRef<GameMetadata>(initialMetadata);

  const [pageConfig, setPageConfig] = useState<PageConfig>(initialConfig);
  const [description, setDescription] = useState(initialDescription);
  const [gameMetadata, setGameMetadata] = useState<GameMetadata>(initialMetadata);

  const {
    items: editLinks,
    setItems: setEditLinks,
    initialRef: initialLinksRef,
    setInitial: setInitialLinks,
  } = useEditableCollection({
    scopeKey: game.id,
    source: linksQuery.data ?? [],
    isFetched: linksQuery.isFetched,
    toEditable: toEditableLinks,
  });

  const {
    items: editMedia,
    setItems: setEditMedia,
    initialRef: initialMediaRef,
    setInitial: setInitialMedia,
  } = useEditableCollection({
    scopeKey: game.id,
    source: mediaQuery.data ?? [],
    isFetched: mediaQuery.isFetched,
    toEditable: toEditableMedia,
  });

  const restoreSnapshot = useCallback((snapshot: EditorSnapshot) => {
    setPageConfig(snapshot.pageConfig);
    setDescription(snapshot.description);
    setGameMetadata(snapshot.gameMetadata);
    setEditLinks(snapshot.editLinks);
    setEditMedia(snapshot.editMedia);
  }, [setEditLinks, setEditMedia]);

  const currentSnapshot = useMemo<EditorSnapshot>(
    () => ({pageConfig, description, gameMetadata, editLinks, editMedia}),
    [description, editLinks, editMedia, gameMetadata, pageConfig],
  );

  const {canUndo, canRedo, undo, redo, pushHistory} = useUndoRedo(
    currentSnapshot,
    restoreSnapshot,
  );

  useEffect(() => {
    pushHistory(currentSnapshot);
  }, [currentSnapshot, pushHistory]);

  const currentHashes = useMemo(
    () => ({
      pageConfig: hashValue(pageConfig),
      metadata: hashValue(gameMetadata),
      links: hashValue(editLinks),
      media: hashValue(editMedia),
    }),
    [editLinks, editMedia, gameMetadata, pageConfig],
  );

  const baselineHashes = {
    pageConfig: hashValue(initialConfigRef.current),
    metadata: hashValue(initialMetadataRef.current),
    links: hashValue(initialLinksRef.current),
    media: hashValue(initialMediaRef.current),
    description: initialDescriptionRef.current,
  };

  const pageConfigDirty = currentHashes.pageConfig !== baselineHashes.pageConfig;
  const descriptionDirty = description !== baselineHashes.description;
  const metadataDirty = currentHashes.metadata !== baselineHashes.metadata;
  const linksDirty = currentHashes.links !== baselineHashes.links;
  const mediaDirty = currentHashes.media !== baselineHashes.media;

  const isDirty = pageConfigDirty || descriptionDirty || metadataDirty || linksDirty || mediaDirty;

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

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const isSaving =
    updatePageConfig.isPending
    || updateGame.isPending
    || createLink.isPending
    || updateLink.isPending
    || deleteLink.isPending
    || createMedia.isPending
    || updateMedia.isPending
    || deleteMedia.isPending;

  const handleSave = useCallback(async () => {
    if (!primaryPage || !isDirty) return;

    try {
      const tasks: Promise<unknown>[] = [];

      if (pageConfigDirty) {
        tasks.push(
          updatePageConfig.mutateAsync({pageId: primaryPage.id, pageConfig}),
        );
      }

      if (descriptionDirty || metadataDirty) {
        tasks.push(
          updateGame.mutateAsync({
            id: game.id,
            aboutTheGame: description,
            title: gameMetadata.title,
            coverUrl: gameMetadata.coverUrl || null,
            headerUrl: gameMetadata.headerUrl || null,
            trailerUrl: gameMetadata.trailerUrl || null,
          }),
        );
      }

      if (linksDirty) {
        const linkChanges = diffEditableItems(initialLinksRef.current, editLinks);

        for (const link of linkChanges.deleted) {
          tasks.push(deleteLink.mutateAsync({id: link.id, gameId: game.id}));
        }

        for (const link of linkChanges.created) {
          tasks.push(
            createLink.mutateAsync({
              gameId: game.id,
              ...toLinkMutationInput(link),
            }),
          );
        }

        for (const link of linkChanges.updated) {
          tasks.push(
            updateLink.mutateAsync({
              id: link.id,
              gameId: game.id,
              ...toLinkMutationInput(link),
            }),
          );
        }
      }

      if (mediaDirty) {
        const mediaChanges = diffEditableItems(initialMediaRef.current, editMedia);

        for (const item of mediaChanges.deleted) {
          tasks.push(deleteMedia.mutateAsync({id: item.id, gameId: game.id}));
        }

        for (const item of mediaChanges.created) {
          tasks.push(
            createMedia.mutateAsync({
              gameId: game.id,
              ...toMediaMutationInput(item),
            }),
          );
        }

        for (const item of mediaChanges.updated) {
          tasks.push(
            updateMedia.mutateAsync({
              id: item.id,
              gameId: game.id,
              ...toMediaMutationInput(item),
            }),
          );
        }
      }

      await Promise.all(tasks);

      await Promise.all([
        utils.game.get.invalidate({id: game.id}),
        utils.game.list.invalidate(),
        utils.gameLink.list.invalidate({gameId: game.id}),
        utils.gameMedia.list.invalidate({gameId: game.id}),
      ]);

      initialConfigRef.current = pageConfig;
      initialDescriptionRef.current = description;
      initialMetadataRef.current = gameMetadata;
      setInitialLinks(editLinks);
      setInitialMedia(editMedia);

      showSnackbar({message: 'Page saved', severity: 'success'});
    } catch (error) {
      showSnackbar({
        message: error instanceof Error ? error.message : 'Save failed',
        severity: 'error',
      });
    }
  }, [
    createLink,
    createMedia,
    deleteLink,
    deleteMedia,
    description,
    descriptionDirty,
    editLinks,
    editMedia,
    game.id,
    gameMetadata,
    isDirty,
    initialLinksRef,
    initialMediaRef,
    linksDirty,
    mediaDirty,
    metadataDirty,
    pageConfig,
    pageConfigDirty,
    primaryPage,
    setInitialLinks,
    setInitialMedia,
    showSnackbar,
    updateGame,
    updateLink,
    updateMedia,
    updatePageConfig,
    utils.game.get,
    utils.game.list,
    utils.gameLink.list,
    utils.gameMedia.list,
  ]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      // eslint-disable-next-line no-alert
      if (!confirm('You have unsaved changes. Discard and close?')) return;
    }
    navigate('..', {relative: 'path'});
  }, [isDirty, navigate]);

  const handleTogglePreviewMode = useCallback(() => {
    setPreviewMode((mode) => (mode === 'desktop' ? 'mobile' : 'desktop'));
  }, []);

  useEditorShortcuts({
    onClose: handleClose,
    canUndo,
    canRedo,
    undo,
    redo,
  });

  return (
    <Fullscreen>
      <Layout>
        <Sidebar>
          <EditorToolbar
            isDirty={isDirty}
            isSaving={isSaving}
            canUndo={canUndo}
            canRedo={canRedo}
            previewMode={previewMode}
            onClose={handleClose}
            onUndo={undo}
            onRedo={redo}
            onTogglePreviewMode={handleTogglePreviewMode}
            onSave={handleSave}
          />

          <EditorSidebar
            pageConfig={pageConfig}
            description={description}
            links={editLinks}
            media={editMedia}
            gameMetadata={gameMetadata}
            onChange={setPageConfig}
            onDescriptionChange={setDescription}
            onLinksChange={setEditLinks}
            onMediaChange={setEditMedia}
            onGameMetadataChange={setGameMetadata}
          />
        </Sidebar>

        <EditorPreviewContainer previewMode={previewMode}>
          <EditorPreview
            game={game}
            gameMetadata={gameMetadata}
            links={editLinks}
            media={editMedia}
            pageConfig={pageConfig}
            description={description}
          />
        </EditorPreviewContainer>
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
  grid-template-columns: 28rem 1fr;
  height: 100%;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-muted);
  overflow-y: auto;
  background: var(--bg-surface);
`;
