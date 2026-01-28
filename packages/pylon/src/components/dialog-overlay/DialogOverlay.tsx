import type {ComponentPropsWithoutRef, ElementType, ReactNode} from 'react';
import styled, {css} from 'styled-components';
import type {OverlaySize} from '../overlay/Overlay';
import {Overlay} from '../overlay/Overlay';

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

type DialogOverlayProps<T extends ElementType = 'div'> = {
  children: ReactNode;
  className?: string;
  opened: boolean;
  setOpened: (opened: boolean) => void;
  /** Predefined size preset. Defaults to 'md'. */
  size?: OverlaySize;
  /** Close dialog when clicking outside. Defaults to true. */
  cancelOnOutsideClick?: boolean;
  /** Close dialog when pressing Escape. Defaults to true. */
  cancelOnEscKey?: boolean;
  /** Render the layout as a different element (e.g., 'form' for form dialogs) */
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

interface HeaderProps {
  children: ReactNode;
  className?: string;
}

interface ContentProps {
  children: ReactNode;
  className?: string;
}

interface FooterProps {
  children: ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------------ */

const dialogOverlayCss = css`
  background: var(--bg-overlay);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 100%;
`;

/* ------------------------------------------------------------------
 * Main Component
 * ------------------------------------------------------------------ */

/**
 * DialogOverlay provides a centered modal dialog with a consistent layout structure:
 * sticky header, scrollable content area, and sticky footer.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DialogOverlay opened={opened} setOpened={setOpened}>
 *   <DialogOverlay.Header>Title</DialogOverlay.Header>
 *   <DialogOverlay.Content>...scrollable content...</DialogOverlay.Content>
 *   <DialogOverlay.Footer>
 *     <Button onClick={() => setOpened(false)}>Cancel</Button>
 *     <Button variant="primary">Save</Button>
 *   </DialogOverlay.Footer>
 * </DialogOverlay>
 *
 * // As a form
 * <DialogOverlay opened={opened} setOpened={setOpened} as="form" onSubmit={handleSubmit}>
 *   <DialogOverlay.Header>Form Title</DialogOverlay.Header>
 *   <DialogOverlay.Content>...form fields...</DialogOverlay.Content>
 *   <DialogOverlay.Footer>
 *     <Button type="submit">Save</Button>
 *   </DialogOverlay.Footer>
 * </DialogOverlay>
 * ```
 */
export function DialogOverlay<T extends ElementType = 'div'>({
  children,
  className,
  opened,
  setOpened,
  size = 'md',
  cancelOnOutsideClick = true,
  cancelOnEscKey = true,
  as,
  ...props
}: DialogOverlayProps<T>) {
  return (
    <Overlay
      opened={opened}
      setOpened={setOpened}
      animation="scale-in"
      withBackdrop
      cancelOnOutsideClick={cancelOnOutsideClick}
      cancelOnEscKey={cancelOnEscKey}
      shakeOnBlockedClose
      position={{mode: 'centered'}}
      size={size}
      modalCss={dialogOverlayCss}
    >
      <LayoutRoot as={as} className={className} {...props}>
        {children}
      </LayoutRoot>
    </Overlay>
  );
}

/* ------------------------------------------------------------------
 * Sub-components
 * ------------------------------------------------------------------ */

function Header({children, className}: HeaderProps) {
  return <HeaderRoot className={className}>{children}</HeaderRoot>;
}

function Content({children, className}: ContentProps) {
  return <ContentRoot className={className}>{children}</ContentRoot>;
}

function Footer({children, className}: FooterProps) {
  return <FooterRoot className={className}>{children}</FooterRoot>;
}

DialogOverlay.Header = Header;
DialogOverlay.Content = Content;
DialogOverlay.Footer = Footer;

/* ------------------------------------------------------------------
 * Styled Components
 * ------------------------------------------------------------------ */

const LayoutRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: inherit;
  min-height: 0;
  overflow: hidden;
`;

const HeaderRoot = styled.h2`
  flex-shrink: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--text-2xl--line-height);
  margin: 0;
  padding: var(--spacing-6) var(--spacing-6) var(--spacing-3);
`;

const ContentRoot = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--spacing-6) var(--spacing-6);

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: var(--spacing-1-5);
  }

  &::-webkit-scrollbar-track {
    background: var(--scroll-track-color);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scroll-thumb-color);
    border-radius: var(--radius-sm);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--border-deep);
  }
`;

const FooterRoot = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: var(--spacing-3);
  justify-content: flex-end;
  padding: var(--spacing-3) var(--spacing-6) var(--spacing-6);
`;
