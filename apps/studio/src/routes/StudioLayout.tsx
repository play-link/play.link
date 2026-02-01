import {Outlet} from 'react-router-dom';
import {StudioGuard} from '@/components';
import {DashboardLayout} from '@/layouts';

/**
 * Layout for studio-scoped routes.
 * Wraps content with StudioGuard to ensure valid studio context.
 */
export function StudioLayout() {
  return (
    <StudioGuard>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </StudioGuard>
  );
}
