import ErrorState from '../common/ErrorState';
import { usePermissions } from '../../hooks/usePermissions';

export default function PermissionGate({ permissions = [], mode = 'all', fallback, children }) {
  const { hasAllPermissions, hasAnyPermission } = usePermissions();
  const allowed = mode === 'any' ? hasAnyPermission(permissions) : hasAllPermissions(permissions);

  if (allowed) return children;
  return fallback || <ErrorState message="Bạn không có quyền truy cập tính năng này." />;
}
