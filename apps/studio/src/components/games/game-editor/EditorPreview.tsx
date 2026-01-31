import styled from 'styled-components';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {GamePageContent} from '../game-page-content';
import type {PageConfig} from './EditorSidebar';

type GameLink = Tables<'game_links'>;
type GameMedia = Tables<'game_media'>;

const DEFAULTS = {
  bgColor: '#030712',
  textColor: '#ffffff',
  linkColor: '#818cf8',
};

interface EditorPreviewProps {
  game: GameOutletContext;
  links: GameLink[];
  media: GameMedia[];
  pageConfig: PageConfig;
  description: string;
}

export function EditorPreview({game, links, media, pageConfig, description}: EditorPreviewProps) {
  const t = pageConfig.theme ?? {};

  return (
    <PageScroll>
      <GamePageContent
        game={game}
        links={links}
        media={media}
        theme={{
          bgColor: t.bgColor || DEFAULTS.bgColor,
          textColor: t.textColor || DEFAULTS.textColor,
          linkColor: t.linkColor || DEFAULTS.linkColor,
        }}
        descriptionOverride={description}
      />
    </PageScroll>
  );
}

const PageScroll = styled.div`
  flex: 1;
  overflow-y: auto;
`;
