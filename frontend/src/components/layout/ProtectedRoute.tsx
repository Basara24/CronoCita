import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/types';

export function defaultRouteForRole(role: Role): string {
  if (role === 'SUPER_ADMIN') return '/admin';
  if (role === 'PATIENT') return '/minha-conta';
  if (role === 'PROFESSIONAL') return '/profissional';
  return '/painel/agenda';
}

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }

  return <Outlet />;
}
