import type {ReactNode} from 'react';
import styled from 'styled-components';

interface PageLayoutProps {
  children: ReactNode;
}

interface PageLayoutHeaderProps {
  title: string;
  subtitle?: string;
  tabNav?: ReactNode;
  children?: ReactNode;
}

interface PageLayoutContentProps {
  children: ReactNode;
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
function Header({title, subtitle, tabNav, children}: PageLayoutHeaderProps) {
  return (
    <StyledHeader>
      <StyledHeaderTop $hasTabNav={!!tabNav}>
        <div>
          <StyledTitle>{title}</StyledTitle>
          {subtitle && <StyledSubtitle>{subtitle}</StyledSubtitle>}
        </div>
        {children && <StyledActions>{children}</StyledActions>}
      </StyledHeaderTop>
      {tabNav}
    </StyledHeader>
  );
}

/**
 * Main content area of the page.
 */
function Content({children}: PageLayoutContentProps) {
  return <StyledContent>{children}</StyledContent>;
}

PageLayout.Header = Header;
PageLayout.Content = Content;

const StyledPageLayout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: var(--spacing-8);
`;

const StyledHeader = styled.div`
  margin-bottom: var(--spacing-8);
`;

const StyledHeaderTop = styled.div<{$hasTabNav: boolean}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({$hasTabNav}) => ($hasTabNav ? 'var(--spacing-2)' : '0')};
`;

const StyledTitle = styled.h1`
  font-size: var(--text-4xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: var(--fg-subtle);
  margin: var(--spacing-1) 0 0;
`;

const StyledActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const StyledContent = styled.div`
  flex: 1;
`;
