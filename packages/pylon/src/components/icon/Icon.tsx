import type {LucideIcon, LucideProps} from 'lucide-react';

/** Default icon size in pixels. */
export const DEFAULT_ICON_SIZE = 20;

/** Default stroke width for icons. */
export const DEFAULT_STROKE_WIDTH = 1.5;

/**
 * Get default stroke width based on icon size.
 * Smaller icons get slightly thicker strokes for better visibility.
 */
function getDefaultStrokeWidth(size: number): number {
  if (size <= 16) return 1.75;
  return DEFAULT_STROKE_WIDTH;
}

/**
 * Props for the Icon component.
 */
export interface IconProps extends Omit<LucideProps, 'ref'> {
  /**
   * The Lucide icon component to render.
   */
  icon: LucideIcon;
}

/**
 * Icon wrapper component that applies consistent default styling.
 *
 * StrokeWidth is dynamic by default:
 * - size <= 16: strokeWidth = 1.75
 * - size > 16: strokeWidth = 1.5
 *
 * @example
 * import {XIcon} from 'lucide-react';
 * import {Icon} from '@play/pylon';
 *
 * <Icon icon={XIcon} size={20} />
 * <Icon icon={XIcon} size={16} strokeWidth={2} /> // override default
 */
export function Icon({
  icon: IconComponent,
  size = DEFAULT_ICON_SIZE,
  strokeWidth,
  ...props
}: IconProps) {
  const finalStrokeWidth = strokeWidth ?? getDefaultStrokeWidth(size as number);
  return <IconComponent size={size} strokeWidth={finalStrokeWidth} {...props} />;
}
