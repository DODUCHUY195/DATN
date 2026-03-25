import { getPermissionsByRole, ROLES } from '../constants/permissions';
import { useAuthStore } from '../stores/authStore';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || ROLES.USER;
  const permissions = user?.permissions?.length ? user.permissions : getPermissionsByRole(role);

  return {
    role,
    permissions,
    isAdminArea: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN].includes(role),
    hasPermission: (permission) => permissions.includes(permission),
    hasAnyPermission: (required = []) => required.some((permission) => permissions.includes(permission)),
    hasAllPermissions: (required = []) => required.every((permission) => permissions.includes(permission)),
  };
}
