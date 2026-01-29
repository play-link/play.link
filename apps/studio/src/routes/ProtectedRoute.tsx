import {Navigate, Outlet} from 'react-router';
import {useAppContext} from '@/lib/app-context';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({children}: ProtectedRouteProps) {
  const {me, isLoading} = useAppContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-(--primary) border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!me) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}
