import {EyeIcon, PackageIcon, PencilIcon} from 'lucide-react';
import {Button, Tooltip} from '@play/pylon';
import {ActionIcon} from './styles';

interface OverviewActionsPanelProps {
  isPublished: boolean;
  hasPrimaryPage: boolean;
  onDesignPage: () => void;
  onPreviewPage: () => void;
  onViewPublicPage: () => void;
  onOpenPressKit: () => void;
}

export function OverviewActionsPanel({
  isPublished,
  hasPrimaryPage,
  onDesignPage,
  onPreviewPage,
  onViewPublicPage,
  onOpenPressKit,
}: OverviewActionsPanelProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <Button
        variant="primary"
        onClick={onDesignPage}
        className="w-full"
      >
        <ActionIcon>
          <PencilIcon size={16} />
        </ActionIcon>
        Design page
      </Button>

      <Button
        variant="outline"
        onClick={isPublished ? onViewPublicPage : onPreviewPage}
        className="w-full relative"
        disabled={isPublished && !hasPrimaryPage}
      >
        <ActionIcon>
          <EyeIcon size={16} className="fg-muted" />
        </ActionIcon>
        {isPublished ? 'View public page' : 'Preview page'}
      </Button>

      {hasPrimaryPage && (
        <Tooltip
          active={!isPublished}
          text="You need to publish your game first."
        >
          <span className="w-full">
            <Button
              variant="outline"
              onClick={onOpenPressKit}
              className="w-full relative"
              disabled={!isPublished}
            >
              <ActionIcon>
                <PackageIcon size={16} className="fg-muted" />
              </ActionIcon>
              View press kit
            </Button>
          </span>
        </Tooltip>
      )}
    </div>
  );
}
