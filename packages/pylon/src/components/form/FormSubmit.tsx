import type {HTMLAttributes} from 'react';
import styled from 'styled-components';
import type {ButtonSize, ButtonVariant} from '../button';
import {Button} from '../button';
import {Loading} from '../loading';

interface FormSubmitProps {
  children?: React.ReactNode;
  disabled?: boolean;
  size?: ButtonSize;
  submitting?: boolean;
  type?: 'submit' | 'button' | 'reset';
  value?: string;
  variant?: ButtonVariant;
}

type Props = HTMLAttributes<HTMLButtonElement> & FormSubmitProps;

const ButtonContent = styled.span<{$submitting?: boolean}>`
  display: inline-flex;
  align-items: center;
  gap: inherit;
  opacity: ${({$submitting}) => ($submitting ? 0.4 : 1)};
  transition: opacity 0.15s ease;
`;

const SpinnerOverlay = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledLoading = styled(Loading)`
  color: var(--white);
`;

export function FormSubmit({
  children,
  disabled = false,
  size = 'md',
  style,
  submitting,
  type = 'submit',
  value,
  variant = 'primary',
  ...props
}: Props) {
  const buttonStyle = submitting ? {...style, position: 'relative' as const} : style;

  return (
    <Button
      type={type}
      disabled={disabled || submitting}
      variant={variant}
      size={size}
      style={buttonStyle}
      {...props}
    >
      <ButtonContent $submitting={submitting}>{value || children}</ButtonContent>
      {submitting && (
        <SpinnerOverlay>
          <StyledLoading size={size} />
        </SpinnerOverlay>
      )}
    </Button>
  );
}
