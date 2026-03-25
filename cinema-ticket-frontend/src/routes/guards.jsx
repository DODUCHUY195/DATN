import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROLES } from '../constants/permissions';

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function AdminRoute() {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (![ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN].includes(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
