import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="grid gap-6 xl:grid-cols-[auto_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-24 xl:self-start">
        <AdminSidebar />
      </div>
      <div className="min-w-0 space-y-6">
        <Outlet />
      </div>
    </div>
  );
}
