import {useMemo} from 'react';
import styled from 'styled-components';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {GamePageContent} from '../game-page-content';
import type {EditableLink, EditableMedia, GameMetadata, PageConfig} from './types';

const DEFAULTS = {
  bgColor: '#030712',
  textColor: '#ffffff',
  linkColor: '#818cf8',
};

interface EditorPreviewProps {
  game: GameOutletContext;
  gameMetadata: GameMetadata;
  links: EditableLink[];
  media: EditableMedia[];
  pageConfig: PageConfig;
  description: string;
}

export function EditorPreview({
  game,
  gameMetadata,
  links,
  media,
  pageConfig,
  description,
}: EditorPreviewProps) {
  const t = pageConfig.theme ?? {};

  const previewGame = useMemo(
    () => ({
      ...game,
      title: gameMetadata.title,
      header_url: gameMetadata.headerUrl,
      trailer_url: gameMetadata.trailerUrl,
      cover_url: gameMetadata.coverUrl,
    }),
    [game, gameMetadata],
  );

  return (
    <PageScroll>
      <GamePageContent
        game={previewGame}
        links={links as unknown as Tables<'game_links'>[]}
        media={media as unknown as Tables<'game_media'>[]}
        theme={{
          bgColor: t.bgColor || DEFAULTS.bgColor,
          textColor: t.textColor || DEFAULTS.textColor,
          linkColor: t.linkColor || DEFAULTS.linkColor,
          buttonStyle: t.buttonStyle,
          buttonRadius: t.buttonRadius,
          secondaryColor: t.secondaryColor,
          fontFamily: t.fontFamily,
        }}
        descriptionOverride={description}
        headerActions={
          <SubscribeButton
            style={{
              background: `color-mix(in srgb, ${t.textColor || DEFAULTS.textColor} 10%, transparent)`,
              color: t.textColor || DEFAULTS.textColor,
            }}
            title="Get updates"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </SubscribeButton>
        }
      />
    </PageScroll>
  );
}

const PageScroll = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const SubscribeButton = styled.button`
  flex-shrink: 0;
  margin-top: 0.75rem;
  padding: 0.5rem;
  border-radius: 9999px;
  border: 0;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
`;
