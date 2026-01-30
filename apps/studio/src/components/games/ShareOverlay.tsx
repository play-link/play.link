import {CopyIcon, ExternalLinkIcon, ShareIcon, XIcon} from 'lucide-react';
import {useState} from 'react';
import styled from 'styled-components';

interface ShareOverlayProps {
  gameUrl: string;
  gameTitle?: string;
  onClose: () => void;
}

export function ShareOverlay({gameUrl, gameTitle, onClose}: ShareOverlayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: gameTitle,
        url: gameUrl,
      });
    }
  };

  return (
    <Backdrop onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Share</Title>
          <CloseButton type="button" onClick={onClose}>
            <XIcon size={18} />
          </CloseButton>
        </Header>

        <UrlBox>
          <UrlText>{gameUrl}</UrlText>
        </UrlBox>

        <Actions>
          <Action type="button" onClick={handleCopy}>
            <CopyIcon size={18} />
            {copied ? 'Copied!' : 'Copy link'}
          </Action>
          <Action
            as="a"
            href={gameUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLinkIcon size={18} />
            Open in browser
          </Action>
          {typeof navigator.share === 'function' && (
            <Action type="button" onClick={handleNativeShare}>
              <ShareIcon size={18} />
              More options
            </Action>
          )}
        </Actions>
      </Panel>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const CloseButton = styled.button`
  padding: var(--spacing-1);
  border-radius: var(--radius-md);
  color: var(--fg-muted);
  transition:
    color 0.15s,
    background-color 0.15s;

  &:hover {
    color: var(--fg);
    background: var(--bg-hover);
  }
`;

const UrlBox = styled.div`
  background: var(--bg-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3);
`;

const UrlText = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  word-break: break-all;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const Action = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--fg);
  transition: background-color 0.15s;
  text-decoration: none;

  &:hover {
    background: var(--bg-hover);
  }
`;
