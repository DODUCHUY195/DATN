import PageHeader from '../../components/common/PageHeader';
import PermissionGate from '../../components/admin/PermissionGate';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '../../constants/permissions';
import { usePermissions } from '../../hooks/usePermissions';

const matrix = [
  { group: 'Dashboard', items: [PERMISSIONS.DASHBOARD_VIEW] },
  { group: 'Movies', items: [PERMISSIONS.MOVIES_VIEW, PERMISSIONS.MOVIES_CREATE, PERMISSIONS.MOVIES_EDIT, PERMISSIONS.MOVIES_DELETE] },
  { group: 'Cinemas & Rooms', items: [PERMISSIONS.CINEMAS_VIEW, PERMISSIONS.CINEMAS_MANAGE] },
  { group: 'Showtimes', items: [PERMISSIONS.SHOWTIMES_VIEW, PERMISSIONS.SHOWTIMES_MANAGE] },
  { group: 'Bookings', items: [PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.BOOKINGS_MANAGE] },
  { group: 'Users', items: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE] },
  { group: 'Access', items: [PERMISSIONS.ACCESS_VIEW] },
];

export default function AdminAccessPage() {
  const { role, permissions } = usePermissions();

  return (
    <PermissionGate permissions={[PERMISSIONS.ACCESS_VIEW]}>
      <div className="space-y-6">
        <PageHeader title="Phân quyền & truy cập" description="Bảng permission matrix để mở rộng dự án theo chuẩn enterprise-level." />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="card-premium overflow-hidden">
            <div className="border-b border-slate-200/70 p-6 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Permission matrix</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Mô phỏng cơ chế RBAC cho các vai trò chính.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Module</th>
                    {[ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN].map((r) => <th key={r} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{r}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {matrix.map((row) => (
                    <tr key={row.group} className="bg-white/60 dark:bg-slate-950/40">
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-slate-950 dark:text-white">{row.group}</p>
                        <div className="mt-2 flex flex-wrap gap-2">{row.items.map((item) => <span key={item} className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{item}</span>)}</div>
                      </td>
                      {[ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN].map((r) => (
                        <td key={r} className="px-5 py-4 align-top text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex flex-wrap gap-2">{row.items.map((item) => <span key={item} className={`badge ${ROLE_PERMISSIONS[r].includes(item) ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500'}`}>{ROLE_PERMISSIONS[r].includes(item) ? 'Có' : 'Không'}</span>)}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card-premium p-6">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Phiên đăng nhập hiện tại</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tổng quan quyền của tài khoản đang thao tác trong admin portal.</p>
            <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{role}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {permissions.map((permission) => <span key={permission} className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{permission}</span>)}
              </div>
            </div>
          </section>
        </div>
      </div>
    </PermissionGate>
  );
}
