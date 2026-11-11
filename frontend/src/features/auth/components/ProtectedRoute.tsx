import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { Role } from '@/features/auth/types/auth';

interface ProtectedRouteProps {
  /** Roles permitidos; si se omite basta con tener sesión. */
  roles?: Role[];
}

/** Guarda de ruta: sin sesión lleva al login; con sesión pero sin el rol lleva a "sin permiso". */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/sin-permiso" replace />;
  }
  return <Outlet />;
}
