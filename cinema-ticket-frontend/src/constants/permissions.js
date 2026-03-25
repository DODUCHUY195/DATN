export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  MOVIES_VIEW: 'movies:view',
  MOVIES_CREATE: 'movies:create',
  MOVIES_EDIT: 'movies:edit',
  MOVIES_DELETE: 'movies:delete',
  CINEMAS_VIEW: 'cinemas:view',
  CINEMAS_MANAGE: 'cinemas:manage',
  SHOWTIMES_VIEW: 'showtimes:view',
  SHOWTIMES_MANAGE: 'showtimes:manage',
  BOOKINGS_VIEW: 'bookings:view',
  BOOKINGS_MANAGE: 'bookings:manage',
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  ACCESS_VIEW: 'access:view',
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [],
  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.MOVIES_VIEW,
    PERMISSIONS.CINEMAS_VIEW,
    PERMISSIONS.SHOWTIMES_VIEW,
    PERMISSIONS.SHOWTIMES_MANAGE,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_MANAGE,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS).filter((item) => item !== PERMISSIONS.ACCESS_VIEW),
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
};

export function getPermissionsByRole(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.USER];
}
