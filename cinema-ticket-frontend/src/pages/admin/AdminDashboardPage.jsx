import { useState } from 'react';
import { BadgeDollarSign, CalendarRange, Ticket, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import ErrorState from '../../components/common/ErrorState';
import { CardSkeleton } from '../../components/common/Skeleton';
import ChartCard from '../../components/common/ChartCard';
import { useAdminBookings, useAdminDashboard, useAdminShowtimes, useAdminUsers } from '../../hooks/useAdmin';
import { formatCurrency, formatDateTime } from '../../utils/format';
import CustomSelect from '../../components/ui/CustomSelect';

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
        <div className="rounded-2xl bg-amber-400/15 p-3 text-amber-500 dark:bg-amber-300/10 dark:text-amber-300">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

const pieColors = ['#f59e0b', '#ef4444', '#f97316', '#eab308'];
const RANGE_OPTIONS = [
  { value: '7', label: '7 ngày', emoji: '🗓️', meta: 'Theo tuần gần nhất' },
  { value: '30', label: '30 ngày', emoji: '📅', meta: 'Hiệu suất tháng gần đây' },
  { value: '90', label: '90 ngày', emoji: '🎯', meta: 'Góc nhìn quý gần nhất' },
];

export default function AdminDashboardPage() {
  const dashboardQuery = useAdminDashboard();
  const bookingsQuery = useAdminBookings();
  const showtimesQuery = useAdminShowtimes();
  const usersQuery = useAdminUsers();
  const [range, setRange] = useState('30');

  if (dashboardQuery.isLoading || bookingsQuery.isLoading || showtimesQuery.isLoading || usersQuery.isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-52" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-40" />)}</div>
        <div className="grid gap-6 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} className="h-96" />)}</div>
      </div>
    );
  }

  if (dashboardQuery.isError || bookingsQuery.isError || showtimesQuery.isError || usersQuery.isError) {
    return <ErrorState message="Không tải được dữ liệu dashboard" onRetry={() => window.location.reload()} />;
  }

  const stats = dashboardQuery.data || {};
  const bookings = bookingsQuery.data || [];
  const users = usersQuery.data || [];
  const popular = stats.popularShowtimes || [];
  const upcomingShowtimes = (showtimesQuery.data || []).slice(0, 5);
  const days = Number(range);
  const now = Date.now();
  const rangeMs = days * 24 * 60 * 60 * 1000;
  const rangedBookings = bookings.filter((booking) => {
    const date = new Date(booking.createdAt || booking.bookingTime || booking.updatedAt || now).getTime();
    return now - date <= rangeMs;
  });

  const showtimeChartData = popular.map((item) => ({ name: item.Showtime?.Movie?.title?.slice(0, 14) || `#${item.showtimeId}`, seats: item.seatCount }));
  const bookingTrend = rangedBookings.slice(0, 12).reverse().map((booking, index) => ({ day: `Đơn ${index + 1}`, revenue: booking.totalAmount || 0 }));
  const bookingStatusData = [
    { name: 'Confirmed', value: rangedBookings.filter((b) => String(b.status).toUpperCase().includes('CONFIRM')).length || 0 },
    { name: 'Pending', value: rangedBookings.filter((b) => !String(b.status).toUpperCase().includes('CONFIRM') && !String(b.status).toUpperCase().includes('CANCEL')).length || 0 },
    { name: 'Canceled', value: rangedBookings.filter((b) => String(b.status).toUpperCase().includes('CANCEL')).length || 0 },
  ].filter((item) => item.value > 0);
  const revenueByStatus = bookingStatusData.map((item) => ({ name: item.name, value: item.value }));
  const filteredRevenue = rangedBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <section className="card-premium overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_35%),radial-gradient(circle_at_left,rgba(239,68,68,0.14),transparent_30%)]" />
        <div className="relative">
          <PageHeader
            title="Dashboard quản trị"
            description="Bảng điều khiển cinema premium với insight booking, doanh thu, người dùng và suất chiếu hot."
            action={<CustomSelect className="min-w-[180px]" label="Khoảng thời gian" value={range} onChange={setRange} options={RANGE_OPTIONS} />}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Ticket} label="Tổng vé đã bán" value={rangedBookings.length || 0} helper={`Theo phạm vi ${days} ngày`} />
            <StatCard icon={BadgeDollarSign} label="Doanh thu" value={formatCurrency(filteredRevenue || stats.revenue || 0)} helper="Doanh thu từ booking trong phạm vi lọc" />
            <StatCard icon={Users} label="Người dùng" value={users.length} helper="Tài khoản đang có trong hệ thống" />
            <StatCard icon={CalendarRange} label="Suất sắp chiếu" value={upcomingShowtimes.length} helper="Các suất chiếu gần nhất" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Doanh thu booking gần đây" description="Biểu đồ area theo booking mới nhất trong phạm vi lọc." className="xl:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingTrend}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#revenueFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Trạng thái booking" description="Tỷ lệ booking theo trạng thái xử lý.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingStatusData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                  {bookingStatusData.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Suất chiếu phổ biến" description="So sánh số ghế bán theo từng showtime hot.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={showtimeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="seats" radius={[12, 12, 0, 0]} fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Xu hướng trạng thái" description="So sánh số lượng booking theo nhóm trạng thái.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Top booking vừa tạo</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Hỗ trợ kiểm soát vận hành và xử lý vé.</p>
          <div className="mt-4 space-y-4">
            {rangedBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">#{booking.id} · {booking.User?.fullName || 'Khách hàng'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{booking.Showtime?.Movie?.title}</p>
                  </div>
                  <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">{formatCurrency(booking.totalAmount || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Lịch chiếu sắp diễn ra</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Danh sách suất chiếu active gần nhất để admin theo dõi.</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">Realtime overview</div>
          </div>
          <div className="grid gap-3">
            {upcomingShowtimes.map((showtime) => (
              <div key={showtime.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{showtime.Movie?.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{showtime.Room?.Cinema?.name} · {showtime.Room?.name}</p>
                  </div>
                  <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">{showtime.status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{formatDateTime(showtime.startTime)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
