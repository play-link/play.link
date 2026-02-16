import {GamepadIcon} from 'lucide-react';
import styled from 'styled-components';
import {Badge} from '@play/pylon';

export interface GameCardProps {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  published?: boolean;
  onClick?: () => void;
}

export function GameCard({
  title,
  slug,
  coverUrl,
  published,
  onClick,
}: GameCardProps) {
  return (
    <Root onClick={onClick}>
      <Thumbnail>
        {coverUrl ? (
          <ThumbnailImage src={coverUrl} alt={title} />
        ) : (
          <ThumbnailPlaceholder>
            <GamepadIcon size={48} />
          </ThumbnailPlaceholder>
        )}
      </Thumbnail>
      <InfoPanel>
        <div className="flex items-center justify-between gap-3">
          <div className="overflow-hidden">
            <GameTitle>{title}</GameTitle>
            <GameSlug>play.link/{slug}</GameSlug>
          </div>
          <Badge>{published ? 'Published' : 'Draft'}</Badge>
        </div>
      </InfoPanel>
    </Root>
  );
}

const InfoPanel = styled.div`
  position: absolute;
  z-index: 0;
  bottom: 0;
  left: var(--spacing-2-5);
  right: var(--spacing-2-5);
  padding: var(--spacing-4) var(--spacing-4) var(--spacing-4);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
  transform: translateY(50%);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
`;

const Root = styled.button`
  position: relative;
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  padding-bottom: var(--spacing-8);
  transition: transform 0.15s;

  &:hover ${InfoPanel} {
    transform: translateY(56%);
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: var(--radius-2xl);
  }
`;

const Thumbnail = styled.div`
  position: relative;
  z-index: 1;
  aspect-ratio: 15 / 7;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  background: var(--bg-muted);
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbnailPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-subtle);
`;

const GameTitle = styled.h3`
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GameSlug = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
