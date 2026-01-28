import type {LucideIcon} from 'lucide-react';
import {DEFAULT_ICON_SIZE, DEFAULT_STROKE_WIDTH} from './Icon';

/**
 * Helper function to render a Lucide icon with default styling.
 * Useful when you have icon mappings and want to render them consistently.
 *
 * @example
 * const ICONS = { home: HomeIcon, settings: SettingsIcon };
 * renderIcon(ICONS.home, 16)
 *
 * @example
 * // With custom strokeWidth
 * renderIcon(MenuIcon, 24, 2)
 */
export function renderIcon(
  icon: LucideIcon,
  size = DEFAULT_ICON_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
) {
  const IconComponent = icon;
  return <IconComponent size={size} strokeWidth={strokeWidth} />;
}
