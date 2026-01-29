import {ChevronDownIcon} from 'lucide-react';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  Ref,
  RefObject,
} from 'react';
import {NavLink} from 'react-router';
import styled, {css} from 'styled-components';
import {variantsStyles} from './variants';
import type {ButtonSize, ButtonVariant} from './variants';

const ARROW_ICON_SIZE = 14;

// Types
type CommonButtonProps = PropsWithChildren<{
  autoHeight?: boolean;
  disabled?: boolean;
  elevated?: boolean;
  emphasis?: boolean;
  fullRounded?: boolean;
  ref?: RefObject<HTMLButtonElement | HTMLAnchorElement>;
  size?: ButtonSize;
  variant?: ButtonVariant;
  withArrow?: boolean;
}>;

export type ButtonAsButtonProps = CommonButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    to?: undefined;
    end?: undefined;
    type?: 'button' | 'submit' | 'reset';
  };

export type ButtonAsLinkProps = CommonButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    end?: boolean;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

// Styled component transient props
interface StyledButtonProps {
  $autoHeight: boolean;
  $elevated: boolean;
  $emphasis: boolean;
  $fullRounded: boolean;
  $size: ButtonSize;
  $variant: ButtonVariant;
}

// Main component
export function Button({
  autoHeight = false,
  children,
  disabled = false,
  elevated = false,
  emphasis = false,
  end,
  fullRounded = false,
  ref,
  size = 'md',
  to,
  type = 'button',
  variant = 'default',
  withArrow = false,
  ...restProps
}: ButtonProps) {
  const content: ReactNode = (
    <>
      {children}
      {withArrow && <ChevronDownIcon size={ARROW_ICON_SIZE} className="ml-1" />}
    </>
  );

  const styledProps: StyledButtonProps = {
    $autoHeight: autoHeight,
    $elevated: elevated,
    $emphasis: emphasis,
    $fullRounded: fullRounded,
    $size: size,
    $variant: variant,
  };

  if (to) {
    return (
      <StyledLink
        ref={ref as Ref<HTMLAnchorElement>}
        to={to}
        end={end}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        {...styledProps}
        {...(restProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </StyledLink>
    );
  }

  return (
    <StyledButton
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      {...styledProps}
      {...(restProps as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </StyledButton>
  );
}

const sharedButtonStyles = css<StyledButtonProps>`
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  line-height: ${({$autoHeight}) => ($autoHeight ? 'normal' : '1')};
  text-align: center;
  text-decoration: none;
  user-select: none;
  vertical-align: middle;
  white-space: nowrap;

  &:focus-visible {
    outline: 2px solid var(--border-focus);
  }

  &:disabled,
  &[disabled],
  &[aria-disabled='true'] {
    cursor: default;
    filter: grayscale(1) opacity(0.5);
    pointer-events: none;
  }

  ${({$size, $variant, $autoHeight, $elevated, $emphasis, $fullRounded}) => {
    const styleFn = variantsStyles[$variant] || variantsStyles.default;
    return styleFn({
      size: $size,
      autoHeight: $autoHeight,
      elevated: $elevated,
      emphasis: $emphasis,
      fullRounded: $fullRounded,
    });
  }}
`;

// Styled components
const StyledButton = styled.button.attrs<{type?: string}>((props) => ({
  type: props.type || 'button',
}))<StyledButtonProps>`
  ${sharedButtonStyles}
`;

const StyledLink = styled(NavLink)<StyledButtonProps>`
  ${sharedButtonStyles}
`;
