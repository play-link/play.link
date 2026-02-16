import {FileTextIcon} from 'lucide-react';
import {Button, Card} from '@play/pylon';
import {
  CardHeader,
  CardTitle,
  EmptyState,
  UpdateBadge,
  UpdateDate,
  UpdateHeader,
  UpdatePreview,
  UpdateTitle,
} from './styles';
import type {LatestGameUpdate} from './types';

interface OverviewLatestUpdateCardProps {
  latestUpdate: LatestGameUpdate | null;
  onOpenUpdates: () => void;
  onOpenUpdate: (updateId: string) => void;
}

export function OverviewLatestUpdateCard({
  latestUpdate,
  onOpenUpdates,
  onOpenUpdate,
}: OverviewLatestUpdateCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader>
        <CardTitle>Latest update</CardTitle>
        <Button
          variant="ghost"
          size="xs"
          autoHeight
          onClick={onOpenUpdates}
        >
          Open updates →
        </Button>
      </CardHeader>
      {latestUpdate ? (
        <UpdatePreview onClick={() => onOpenUpdate(latestUpdate.id)}>
          <UpdateHeader>
            <UpdateTitle>{latestUpdate.title}</UpdateTitle>
            <UpdateBadge $status={latestUpdate.status}>
              {latestUpdate.status === 'published' ? 'Published' : 'Draft'}
            </UpdateBadge>
          </UpdateHeader>
          <UpdateDate>
            {new Date(latestUpdate.created_at).toLocaleDateString('en', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </UpdateDate>
        </UpdatePreview>
      ) : (
        <EmptyState>
          <FileTextIcon size={24} strokeWidth={1.5} />
          <span>No updates yet</span>
        </EmptyState>
      )}
    </Card>
  );
}
