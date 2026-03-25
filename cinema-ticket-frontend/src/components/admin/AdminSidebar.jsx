import { BarChart3, Building2, CalendarClock, ChevronLeft, ChevronRight, Clapperboard, LayoutDashboard, ShieldCheck, Ticket, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, permission: PERMISSIONS.DASHBOARD_VIEW },
  { to: '/admin/movies', label: 'Quản lý phim', icon: Clapperboard, permission: PERMISSIONS.MOVIES_VIEW },
  { to: '/admin/cinemas', label: 'Rạp & phòng', icon: Building2, permission: PERMISSIONS.CINEMAS_VIEW },
  { to: '/admin/showtimes', label: 'Suất chiếu', icon: CalendarClock, permission: PERMISSIONS.SHOWTIMES_VIEW },
  { to: '/admin/bookings', label: 'Đặt vé', icon: Ticket, permission: PERMISSIONS.BOOKINGS_VIEW },
  { to: '/admin/users', label: 'Người dùng', icon: Users, permission: PERMISSIONS.USERS_VIEW },
  { to: '/admin/access', label: 'Phân quyền', icon: ShieldCheck, permission: PERMISSIONS.ACCESS_VIEW },
];

export default function AdminSidebar() {
  const collapsed = useUiStore((s) => s.adminSidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleAdminSidebar);
  const { hasPermission, role } = usePermissions();

  return (
    <aside className={`rounded-[28px] border border-white/10 bg-slate-950 p-4 text-white shadow-2xl transition-all duration-300 ${collapsed ? 'xl:w-[110px]' : 'xl:w-[300px]'}`}>
      <div className={`rounded-[24px] bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 p-5 text-slate-950 ${collapsed ? 'text-center' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          {!collapsed ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em]">Cinema Admin</p>
              <h2 className="mt-2 text-2xl font-bold">Enterprise Suite</h2>
            </div>
          ) : <p className="mx-auto text-xs font-black tracking-[0.35em]">ADM</p>}
          <button className="hidden rounded-2xl bg-white shadow p-2 text-slate-950 xl:block" onClick={toggle}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        {!collapsed ? <p className="mt-2 text-sm text-slate-900/80">Vai trò hiện tại: <span className="font-semibold">{role}</span></p> : null}
      </div>

      <nav className="mt-6 space-y-2">
        {items.filter((item) => hasPermission(item.permission)).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center' : ''} gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed ? label : null}
          </NavLink>
        ))}
      </nav>

      {!collapsed ? (
        <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-400/15 p-3 text-amber-300">
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Enterprise monitoring</p>
              <p className="text-xs text-slate-400">Theo dõi insight, phân quyền và tác vụ hàng loạt</p>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
