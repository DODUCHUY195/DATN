import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.10),transparent_18%),linear-gradient(180deg,#f8fafc_0%,#fff7ed_42%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.08),transparent_15%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <Navbar />
      <main className="container-page py-8">
        <Outlet />
      </main>
    </div>
  );
}
