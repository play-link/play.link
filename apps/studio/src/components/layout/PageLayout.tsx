import type {ReactNode} from 'react';
import styled from 'styled-components';

interface PageLayoutProps {
  children: ReactNode;
}

interface PageLayoutHeaderProps {
  title: string;
  tabNav?: ReactNode;
  children?: ReactNode;
  className?: string;
}

interface PageLayoutContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Root layout wrapper for pages.
 * Use with PageLayout.Header and PageLayout.Content for consistent page structure.
 *
 * @example
 * <PageLayout>
 *   <PageLayout.Header title="Members" subtitle="Manage team members">
 *     <Button>Add Member</Button>
 *   </PageLayout.Header>
 *   <PageLayout.Content>
 *     <MembersTable ... />
 *   </PageLayout.Content>
 * </PageLayout>
 */
export function PageLayout({children}: PageLayoutProps) {
  return <StyledPageLayout>{children}</StyledPageLayout>;
}

/**
 * Page header with title, optional subtitle, and action slot.
 */
function Header({title, tabNav, children, className}: PageLayoutHeaderProps) {
  return (
    <StyledHeader className={className}>
      <StyledHeaderTop $hasTabNav={!!tabNav}>
        <StyledTitle>{title}</StyledTitle>
        {children && <StyledActions>{children}</StyledActions>}
      </StyledHeaderTop>
      {tabNav}
    </StyledHeader>
  );
}

/**
 * Main content area of the page.
 */
function Content({children, className}: PageLayoutContentProps) {
  return <StyledContent className={className}>{children}</StyledContent>;
}

PageLayout.Header = Header;
PageLayout.Content = Content;

const StyledPageLayout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 0 var(--spacing-14) 0 var(--spacing-10);
`;

const StyledHeader = styled.div`
  padding-top: var(--spacing-10);
`;

const StyledHeaderTop = styled.div<{$hasTabNav: boolean}>`
  display: flex;
  align-items: center;
  margin-bottom: ${({$hasTabNav}) => ($hasTabNav ? 'var(--spacing-3)' : '0')};
`;

const StyledTitle = styled.h1`
  display: inline-flex;
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-semibold);
  margin: 0;
  padding-right: var(--spacing-6);
  letter-spacing: -0.5px;
`;

const StyledActions = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

const StyledContent = styled.div`
  flex: 1;
`;
