import { Navigate } from 'react-router-dom';
import { useAppContext } from '@/lib/app-context';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { me, isLoading } = useAppContext();

  if (isLoading) {
    return null;
  }

  if (!me || me.email !== import.meta.env.VITE_SUPER_ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
