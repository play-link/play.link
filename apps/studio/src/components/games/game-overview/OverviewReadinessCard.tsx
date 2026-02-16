import {CheckCircle2Icon, CircleIcon} from 'lucide-react';
import {Card} from '@play/pylon';
import type {PageCompleteness} from './types';
import {
  CardTitle,
  Checklist,
  ChecklistItem,
  PercentageLabel,
  PercentageRow,
  ProgressFill,
  ProgressTrack,
} from './styles';

interface OverviewReadinessCardProps {
  completeness: PageCompleteness;
}

export function OverviewReadinessCard({completeness}: OverviewReadinessCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Launch readiness</CardTitle>
      <PercentageRow>
        <PercentageLabel>{completeness.percentage}%</PercentageLabel>
      </PercentageRow>
      <ProgressTrack>
        <ProgressFill $percentage={completeness.percentage} />
      </ProgressTrack>
      <Checklist>
        {completeness.missing.map((item) => (
          <ChecklistItem key={item.label} $done={false}>
            <CircleIcon size={14} />
            {item.label}
          </ChecklistItem>
        ))}
        {completeness.completed.map((item) => (
          <ChecklistItem key={item.label} $done>
            <CheckCircle2Icon size={14} />
            {item.label}
          </ChecklistItem>
        ))}
      </Checklist>
    </Card>
  );
}
