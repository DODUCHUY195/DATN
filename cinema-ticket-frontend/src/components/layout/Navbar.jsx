import { Link, NavLink, useNavigate } from "react-router-dom";
import { Film, LayoutDashboard, LogOut, Ticket } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuthStore } from "../../stores/authStore";
import { useLogout } from "../../hooks/useAuth";

export default function Navbar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-white/75 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-800">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-3 font-bold text-slate-950 dark:text-white"
        >
          <div className="rounded-2xl bg-brand-600 p-2 text-white">
            <Film size={18} />
          </div>
          CinemaX
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {[
            ["/", "Trang chủ"],
            ["/movies", "Phim"],
            ["/showtimes", "Lịch chiếu"],
            ["/bookings", "Vé của tôi"],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-2xl px-4 py-2 text-sm font-medium ${isActive ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"}`
              }
            >
              {label}
            </NavLink>
          ))}
          {user?.role === "ADMIN" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-2xl px-4 py-2 text-sm font-medium ${isActive ? "bg-gradient-to-r from-amber-400 to-red-500 text-slate-950" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"}`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {/* <ThemeToggle /> */}
          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 md:block dark:bg-slate-900 dark:text-slate-100"
              >
                {user.fullName}
              </Link>
              <button className="btn-secondary" onClick={handleLogout}>
                <LogOut size={16} className="mr-2" /> Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link className="btn-secondary" to="/login">
                Đăng nhập
              </Link>
              <Link className="btn-primary" to="/register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="container-page flex items-center gap-2 overflow-auto pb-3 md:hidden">
        <Link to="/movies" className="btn-secondary">
          <Film size={16} className="mr-2" /> Phim
        </Link>
        <Link to="/bookings" className="btn-secondary">
          <Ticket size={16} className="mr-2" /> Vé
        </Link>
        {user?.role === "ADMIN" && (
          <Link to="/admin" className="btn-secondary">
            <LayoutDashboard size={16} className="mr-2" /> Admin
          </Link>
        )}
      </div>
    </header>
  );
}
