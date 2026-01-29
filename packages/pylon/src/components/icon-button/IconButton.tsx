import {ChevronDownIcon} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {ButtonHTMLAttributes, ReactNode, RefObject} from 'react';
import styled from 'styled-components';
import {renderIcon} from '../icon';
import type {IconButtonVariant} from './variants';
import {getVariant} from './variants';

export type IconButtonSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';

const ARROW_ICON_SIZE = 14;

// Auto-size icon based on button size
const ICON_SIZES: Record<IconButtonSize, number> = {
  xxs: 14,
  xs: 16,
  sm: 18,
  md: 20,
  lg: 20,
};

interface IconButtonOwnProps {
  'aria-label'?: string;
  as?: React.ElementType;
  /** Icon component to render. If provided, children are ignored. */
  icon?: LucideIcon;
  /** Fallback content if icon is not provided */
  children?: ReactNode;
  ref?: RefObject<HTMLButtonElement | HTMLAnchorElement | null>;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  withArrow?: boolean;
}

export type IconButtonProps = IconButtonOwnProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function IconButton({
  as = 'button',
  icon,
  children,
  ref,
  size = 'md',
  variant = 'default',
  withArrow = false,
  ...restProps
}: IconButtonProps) {
  // Render icon with auto-sized dimensions if icon prop is provided
  const iconContent = icon ? renderIcon(icon, ICON_SIZES[size]) : children;

  return (
    <StyledIconButton
      ref={ref}
      as={as}
      type="button"
      size={size}
      variant={variant}
      withArrow={withArrow}
      {...restProps}
    >
      {iconContent}
      {withArrow && <ChevronDownIcon size={ARROW_ICON_SIZE} className="ml-1" />}
    </StyledIconButton>
  );
}

const StyledIconButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['size', 'variant', 'withArrow'].includes(prop),
})<{
  size: IconButtonSize;
  variant: IconButtonVariant;
  withArrow: boolean;
}>`
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  text-decoration: none;
  user-select: none;

  &[disabled] {
    cursor: default;
    opacity: 0.6;
    pointer-events: none;
  }

  ${(p) =>
    getVariant({
      size: p.size,
      variant: p.variant,
      withArrow: p.withArrow,
    })}
`;
