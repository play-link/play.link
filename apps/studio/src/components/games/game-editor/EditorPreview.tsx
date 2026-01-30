import styled from 'styled-components';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {GamePageContent} from '../game-page-content';
import type {PageConfig} from './EditorSidebar';

type GameLink = Tables<'game_links'>;

const DEFAULTS = {
  bgColor: '#030712',
  textColor: '#ffffff',
  linkColor: '#818cf8',
};

interface EditorPreviewProps {
  game: GameOutletContext;
  links: GameLink[];
  pageConfig: PageConfig;
}

export function EditorPreview({game, links, pageConfig}: EditorPreviewProps) {
  const t = pageConfig.theme ?? {};

  return (
    <PageScroll>
      <GamePageContent
        game={game}
        links={links}
        theme={{
          bgColor: t.bgColor || DEFAULTS.bgColor,
          textColor: t.textColor || DEFAULTS.textColor,
          linkColor: t.linkColor || DEFAULTS.linkColor,
        }}
      />
    </PageScroll>
  );
}

const PageScroll = styled.div`
  flex: 1;
  overflow-y: auto;
`;
