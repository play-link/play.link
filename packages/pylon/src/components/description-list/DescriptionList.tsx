import {CheckCircleIcon, HelpCircleIcon, InfoIcon} from 'lucide-react';
import type {PropsWithChildren, ReactNode} from 'react';
import {createContext, use} from 'react';
import styled, {css} from 'styled-components';
import {mediaQuery} from '../../style';
import type {Spacing} from '../../style';
import type {TooltipProps} from '../tooltip';
import {Tooltip} from '../tooltip';

// Icon mapping for tooltip icons
const TOOLTIP_ICONS = {
  info: InfoIcon,
  'check-circle': CheckCircleIcon,
  'help-circle': HelpCircleIcon,
} as const;

type TooltipIconType = keyof typeof TOOLTIP_ICONS;

// Context for sharing list configuration with items
type DescriptionListContextType = {
  bordered: boolean;
  labelWidth: string;
  labelWidthMd: string;
  striped: boolean;
};

const DescriptionListContext = createContext<DescriptionListContextType>({
  bordered: true,
  labelWidth: '35%',
  labelWidthMd: '20%',
  striped: false,
});

// ============================================
// MAIN COMPONENT: DescriptionList
// ============================================

type DescriptionListProps = PropsWithChildren<{
  /**
   * Bleed spacing for negative margin (to align with parent padding)
   * @default 0
   */
  bleed?: Spacing;
  /**
   * Whether to show borders between items
   * @default true
   */
  bordered?: boolean;
  /**
   * Gap between items (only applies when bordered is false)
   * @default 2
   */
  gap?: Spacing;
  /**
   * Width of the label column on mobile
   * @default '35%'
   */
  labelWidth?: string;
  /**
   * Width of the label column on desktop (md and up)
   * @default '20%'
   */
  labelWidthMd?: string;
  /**
   * Whether to add alternating background colors
   * @default false
   */
  striped?: boolean;
}>;

function DescriptionListRoot({
  bleed = 0,
  bordered = true,
  children,
  gap = 2,
  labelWidth = '35%',
  labelWidthMd = '20%',
  striped = false,
  ...restProps
}: DescriptionListProps) {
  return (
    <DescriptionListContext value={{bordered, labelWidth, labelWidthMd, striped}}>
      <Container $bleed={bleed} $gap={gap} $bordered={bordered} {...restProps}>
        {children}
      </Container>
    </DescriptionListContext>
  );
}

const Container = styled.div<{
  $bleed: Spacing;
  $bordered: boolean;
  $gap: Spacing;
}>`
  display: flex;
  flex-direction: column;
  margin-left: calc(var(--spacing-${(p) => p.$bleed}) * -1);
  width: calc(100% + var(--spacing-${(p) => p.$bleed}) * 2);
`;

// ============================================
// ITEM COMPONENT: DescriptionList.Item
// ============================================

type DescriptionListItemProps = PropsWithChildren<{
  /**
   * Custom column widths (overrides parent labelWidth)
   */
  cols?: string;
  /**
   * Label/title for this item
   */
  title?: ReactNode;
  /**
   * Tooltip to show next to the title
   */
  tooltipProps?: Omit<TooltipProps, 'children'>;
  /**
   * Icon to show in tooltip (or false to hide)
   * @default 'info'
   */
  tooltipIcon?: TooltipIconType | false;
  /**
   * Align the content to the top of the row
   */
  alignTop?: boolean;
}>;

function DescriptionListItem({
  alignTop,
  children,
  cols,
  title,
  tooltipProps,
  tooltipIcon = 'info',
  ...restProps
}: DescriptionListItemProps) {
  const {bordered, labelWidth, labelWidthMd, striped} = use(DescriptionListContext);
  const hasTooltip = !!tooltipProps;
  const TooltipIcon = tooltipIcon ? TOOLTIP_ICONS[tooltipIcon] : null;

  return (
    <DL
      $cols={cols}
      $labelWidth={labelWidth}
      $labelWidthMd={labelWidthMd}
      $bordered={bordered}
      $striped={striped}
      {...restProps}
    >
      <DT $alignTop={alignTop}>
        {title}
        {hasTooltip && TooltipIcon && (
          <Tooltip
            overlayPosition={{
              horizontalAlign: 'right',
              horizontalOffset: 6,
              noHorizontalOverlap: true,
              noVerticalOverlap: false,
              verticalAlign: 'bottom',
              verticalOffset: -16,
            }}
            {...tooltipProps}
          >
            <TooltipIcon size={16} className="ml-2 fg-muted" />
          </Tooltip>
        )}
      </DT>
      <dd>{children}</dd>
    </DL>
  );
}

interface DLProps {
  $bordered: boolean;
  $cols?: string;
  $labelWidth: string;
  $labelWidthMd: string;
  $striped: boolean;
}

const DL = styled.dl<DLProps>`
  display: grid;
  gap: var(--spacing-4);
  grid-template-columns: ${(p) => p.$cols || p.$labelWidth} 1fr;
  padding: var(--spacing-3) var(--spacing-5);

  ${(p) =>
    p.$bordered &&
    css`
      border-bottom: 1px solid var(--border-muted);

      &:last-child {
        border-bottom: none;
      }
    `}

  ${(p) =>
    p.$striped &&
    css`
      &:nth-child(odd) {
        background: var(--bg-muted);
      }
    `}

  ${(p) =>
    mediaQuery(
      'md>',
      css`
        grid-template-columns: ${p.$cols || p.$labelWidthMd} 1fr;
      `,
    )}
`;

const DT = styled.dt<{$alignTop?: boolean}>`
  align-items: ${(p) => (p.$alignTop ? 'flex-start' : 'center')};
  color: var(--fg-muted);
  display: flex;
`;

// ============================================
// COMPOUND COMPONENT EXPORT
// ============================================

export const DescriptionList = Object.assign(DescriptionListRoot, {
  Item: DescriptionListItem,
});

// Also export individual components for backwards compatibility
export {DescriptionListItem};
