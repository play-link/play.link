import styled from 'styled-components';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const StyledButton = styled.button<{$variant: string; $size: string}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  /* Size variants */
  ${({$size}) => {
    switch ($size) {
      case 'sm':
        return `
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        `;
      case 'lg':
        return `
          padding: 1rem 2rem;
          font-size: 1.125rem;
        `;
      default:
        return `
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
        `;
    }
  }}

  /* Style variants */
  ${({$variant}) => {
    switch ($variant) {
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: white;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: white;
          
          &:hover {
            background: rgba(255, 255, 255, 0.1);
          }
        `;
      default:
        return `
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.5);
          }
          
          &:active {
            transform: translateY(0);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  return (
    <StyledButton $variant={variant} $size={size} {...props}>
      {children}
    </StyledButton>
  );
}
