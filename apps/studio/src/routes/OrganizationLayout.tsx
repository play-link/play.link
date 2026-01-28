import {Outlet} from 'react-router-dom';
import {OrganizationGuard} from '@/components';
import {DashboardLayout} from '@/layouts';

/**
 * Layout for organization-scoped routes.
 * Wraps content with OrganizationGuard to ensure valid org context.
 */
export function OrganizationLayout() {
  return (
    <OrganizationGuard>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </OrganizationGuard>
  );
}
