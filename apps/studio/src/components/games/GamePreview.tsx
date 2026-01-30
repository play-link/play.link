import {ArrowLeftIcon, EyeIcon, PencilIcon} from 'lucide-react';
import {useNavigate, useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button} from '@play/pylon';
import type {Tables} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {trpc} from '@/lib/trpc';
import {GamePageContent} from './game-page-content';

const DEFAULTS = {
  bgColor: '#030712',
  textColor: '#ffffff',
  linkColor: '#818cf8',
};

export function GamePreview() {
  const game = useOutletContext<GameOutletContext>();
  const navigate = useNavigate();

  const pages = (game.pages ?? []) as Tables<'game_pages'>[];
  const primaryPage = pages.find((p) => p.is_primary);
  const pageConfig = (primaryPage?.page_config as Record<string, any>) ?? {};
  const t = pageConfig.theme ?? {};

  const {data: links = []} = trpc.gameLink.list.useQuery({gameId: game.id});

  const goBack = () => navigate('..', {relative: 'path'});
  const goDesign = () => navigate('../design', {relative: 'path'});

  return (
    <Fullscreen>
      <Toolbar>
        <ToolbarLeft>
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeftIcon size={16} />
            Back to game
          </Button>
        </ToolbarLeft>
        <ToolbarCenter>
          <PreviewBadge>
            <EyeIcon size={14} />
            Preview mode
          </PreviewBadge>
          <PreviewHint>
            This is how your page looks to visitors — draft or unreleased games
            are only visible here.
          </PreviewHint>
        </ToolbarCenter>
        <ToolbarRight>
          <Button variant="ghost" size="sm" onClick={goDesign}>
            <PencilIcon size={16} />
            Edit page
          </Button>
        </ToolbarRight>
      </Toolbar>

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
    </Fullscreen>
  );
}

const Fullscreen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: #000;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-4);
  background: rgba(0, 0, 0, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  min-height: 3rem;
`;

const ToolbarLeft = styled.div`
  flex: 1;
  display: flex;
  align-items: center;

  button {
    color: rgba(255, 255, 255, 0.7);
    gap: var(--spacing-2);

    &:hover {
      color: #fff;
    }
  }
`;

const ToolbarCenter = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const PreviewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
`;

const PreviewHint = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  max-width: 24rem;
  display: none;

  @media (min-width: 1024px) {
    display: block;
  }
`;

const ToolbarRight = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  button {
    color: rgba(255, 255, 255, 0.7);
    gap: var(--spacing-2);

    &:hover {
      color: #fff;
    }
  }
`;

const PageScroll = styled.div`
  flex: 1;
  overflow-y: auto;
`;
