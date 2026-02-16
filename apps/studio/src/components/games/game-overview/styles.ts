import styled from 'styled-components';

export const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--spacing-4);
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

export const ActionIcon = styled.span`
  position: absolute;
  left: var(--spacing-3);
  top: 0;
  bottom: 0;
  display: inline-flex;
  align-items: center;
`;

export const HeroLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-6);
  min-width: 0;
  width: 100%;
`;

export const CoverThumb = styled.div`
  width: 12.5rem;
  aspect-ratio: 15 / 7;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-muted);
  flex-shrink: 0;
`;

export const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const CoverPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-subtle);
`;

export const HeroInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--spacing-3);
  min-width: 0;
`;

export const SlugRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex: 1;
  min-width: 0;
`;

export const SlugTitle = styled.h2`
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

export const HeroTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  width: 100%;
`;

export const HeroActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
  justify-content: flex-start;
`;

export const HeroHelperText = styled.p`
  font-size: var(--text-xs);
  color: var(--fg-muted);
  margin: 0;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

export const CardTitle = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

export const CardHeaderRight = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
`;

export const CardSubtitle = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-4);
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

export const StatIcon = styled.div`
  color: var(--fg-muted);
`;

export const StatValue = styled.span`
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
`;

export const StatLabel = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
`;

export const UpdatePreview = styled.button`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  background: var(--bg-muted);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;

  &:hover {
    background: var(--bg-hover);
  }
`;

export const UpdateHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

export const UpdateTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg);
`;

export const UpdateBadge = styled.span<{$status: string}>`
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  padding: 1px var(--spacing-2);
  border-radius: var(--radius-full);
  background: ${(p) =>
    p.$status === 'published' ? 'var(--color-green-600)' : 'var(--bg-muted)'};
  color: ${(p) =>
    p.$status === 'published' ? 'var(--white)' : 'var(--fg-muted)'};
`;

export const UpdateDate = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6);
  color: var(--fg-subtle);
  font-size: var(--text-sm);
`;

export const PercentageRow = styled.div`
  display: flex;
  align-items: baseline;
`;

export const PercentageLabel = styled.span`
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
`;

export const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  background: var(--bg-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
`;

export const ProgressFill = styled.div<{$percentage: number}>`
  width: ${(p) => p.$percentage}%;
  height: 100%;
  background: var(--color-primary-600);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
`;

export const Checklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

export const ChecklistItem = styled.div<{$done: boolean}>`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: ${(p) => (p.$done ? 'var(--fg-subtle)' : 'var(--fg)')};
`;

export const ConfirmContent = styled.div`
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

export const ConfirmTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

export const ConfirmDescription = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
`;

export const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
`;
