import type {ReactNode} from 'react';

interface PageLayoutProps {
  children: ReactNode;
}

interface PageLayoutHeaderProps {
  title: string;
  subtitle?: string;
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
  return <div className="flex flex-col min-h-full p-10">{children}</div>;
}

/**
 * Page header with title, optional subtitle, and action slot.
 */
function Header({title, subtitle, children}: PageLayoutHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-4xl font-bold text-(--fg)">{title}</h1>
        {subtitle && <p className="text-(--fg-subtle) mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

/**
 * Main content area of the page.
 */
function Content({children}: PageLayoutContentProps) {
  return <div className="flex-1">{children}</div>;
}

PageLayout.Header = Header;
PageLayout.Content = Content;
