import {GamepadIcon} from 'lucide-react';
import styled from 'styled-components';

export interface GameCardProps {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  status: string;
  onClick?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  UPCOMING: 'Upcoming',
  EARLY_ACCESS: 'Early Access',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
};

export function GameCard({title, slug, coverUrl, status, onClick}: GameCardProps) {
  return (
    <Card onClick={onClick}>
      <Cover>
        {coverUrl ? (
          <CoverImage src={coverUrl} alt={title} />
        ) : (
          <CoverPlaceholder>
            <GamepadIcon size={48} />
          </CoverPlaceholder>
        )}
        <StatusBadge $status={status}>{STATUS_LABELS[status] || status}</StatusBadge>
      </Cover>
      <Info>
        <Title>{title}</Title>
        <Slug>play.link/{slug}</Slug>
      </Info>
    </Card>
  );
}

const Card = styled.button`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  overflow: hidden;
  text-align: left;
  transition: border-color 0.15s, transform 0.15s;
  cursor: pointer;

  &:hover {
    border-color: var(--border);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
`;

const Cover = styled.div`
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  background: var(--bg-muted);
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CoverPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-subtle);
`;

const StatusBadge = styled.span<{$status: string}>`
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  background: ${(p) => {
    switch (p.$status) {
      case 'RELEASED':
        return 'var(--color-green-600)';
      case 'EARLY_ACCESS':
        return 'var(--color-blue-600)';
      case 'UPCOMING':
        return 'var(--color-purple-600)';
      case 'CANCELLED':
        return 'var(--color-red-600)';
      default:
        return 'var(--bg-muted)';
    }
  }};
  color: var(--white);
`;

const Info = styled.div`
  padding: var(--spacing-4);
`;

const Title = styled.h3`
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const Slug = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: var(--spacing-1) 0 0;
`;
