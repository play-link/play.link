import {CheckIcon, LayoutGridIcon, ListIcon} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  Icon,
  IconButton,
  NavigationList,
  SegmentedControls,
} from '@play/pylon';
import {gamesViewModeOptions, gamesVisibilityFilterItems} from './constants';
import type {GamesViewMode, GamesVisibilityFilter} from './types';

interface GamesPageToolbarProps {
  visibilityFilter: GamesVisibilityFilter;
  onVisibilityFilterChange: (filter: GamesVisibilityFilter) => void;
  viewMode: GamesViewMode;
  onViewModeChange: (mode: GamesViewMode) => void;
}

export function GamesPageToolbar({
  visibilityFilter,
  onVisibilityFilterChange,
  viewMode,
  onViewModeChange,
}: GamesPageToolbarProps) {
  return (
    <div className=" flex justify-between gap-3">
      <div className="flex items-center gap-3">
        <SegmentedControls
          items={gamesVisibilityFilterItems}
          value={visibilityFilter}
          onChange={(item) =>
            onVisibilityFilterChange(item.value as GamesVisibilityFilter)
          }
        />
        <DropdownMenu>
          <IconButton
            variant="filled"
            icon={viewMode === 'grid' ? LayoutGridIcon : ListIcon}
            withArrow
          />
          <NavigationList noAutoFocus>
            {gamesViewModeOptions.map((option) => (
              <Button
                key={option.value}
                variant="menu"
                size="sm"
                className="w-full"
                onClick={() => onViewModeChange(option.value)}
              >
                {viewMode === option.value && (
                  <Icon icon={CheckIcon} size={14} className="mr-2" />
                )}
                <Icon
                  icon={option.icon}
                  size={16}
                  className={viewMode !== option.value ? 'ml-6' : ''}
                />
                <span className="ml-2">{option.label}</span>
              </Button>
            ))}
          </NavigationList>
        </DropdownMenu>
      </div>
    </div>
  );
}
