import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Ban,
  BarChart3,
  Building2,
  CalendarRange,
  Clock3,
  Film,
  Percent,
  Ticket,
  TrendingDown,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import { CardSkeleton } from "../../components/common/Skeleton";
import ChartCard from "../../components/common/ChartCard";
import { useAdminDashboard } from "../../hooks/useAdmin";
import { formatCurrency } from "../../utils/format";

const chartColors = [
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
];

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function getCurrentMonthRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    dateFrom: toDateInputValue(firstDay),
    dateTo: toDateInputValue(lastDay),
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickNumber(item, keys = []) {
  if (!item || typeof item !== "object") return 0;

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) {
      return Number(item[key] || 0);
    }
  }

  return Number(
    item.revenue ||
      item.totalRevenue ||
      item.totalAmount ||
      item.amount ||
      item.value ||
      item.total ||
      item.ticketCount ||
      item.totalTickets ||
      item.seatCount ||
      item.views ||
      0,
  );
}

function pickName(item, fallback = "Không rõ") {
  if (!item || typeof item !== "object") return fallback;

  return (
    item.name ||
    item.title ||
    item.movieTitle ||
    item.cinemaName ||
    item.roomName ||
    item.showtimeName ||
    item.Movie?.title ||
    item.Cinema?.name ||
    item.Room?.name ||
    item.Showtime?.Movie?.title ||
    fallback
  );
}

function normalizeRevenueData(items, type = "revenue") {
  return safeArray(items).map((item, index) => ({
    name: String(pickName(item, `#${index + 1}`)).slice(0, 20),
    value: pickNumber(
      item,
      type === "tickets"
        ? [
            "tickets",
            "ticketCount",
            "totalTickets",
            "soldTickets",
            "seatCount",
            "views",
          ]
        : [
            "revenue",
            "totalRevenue",
            "totalAmount",
            "amount",
            "value",
            "total",
          ],
    ),
    raw: item,
  }));
}

function normalizeShowtimePerDay(items) {
  return safeArray(items).map((item) => ({
    date: item.date,
    totalShowtimes: Number(item.totalShowtimes || item.total || 0),
  }));
}

function StatCard({ icon: Icon, label, value, helper, tone = "amber" }) {
  const toneClass = {
    amber:
      "bg-amber-400/15 text-amber-500 dark:bg-amber-300/10 dark:text-amber-300",
    red: "bg-red-400/15 text-red-500 dark:bg-red-300/10 dark:text-red-300",
    emerald:
      "bg-emerald-400/15 text-emerald-500 dark:bg-emerald-300/10 dark:text-emerald-300",
    blue: "bg-blue-400/15 text-blue-500 dark:bg-blue-300/10 dark:text-blue-300",
    violet:
      "bg-violet-400/15 text-violet-500 dark:bg-violet-300/10 dark:text-violet-300",
  }[tone];

  return (
    <div className="card-premium p-5">
      <div className="flex items-center gap-2">
        <div
          className={`shrink-0 size-10 rounded-xl flex items-center justify-center ${toneClass}`}
        >
          <Icon size={20} />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mt-3 break-words text-3xl font-bold text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyBox({ text = "Chưa có dữ liệu" }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
      {text}
    </div>
  );
}

function SimpleRanking({
  title,
  description,
  items,
  valueType = "currency",
  emptyText,
}) {
  return (
    <div className="card-premium p-6">
      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <EmptyBox text={emptyText} />
        ) : (
          items.slice(0, 6).map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {valueType === "currency" ? "Doanh thu" : "Lượt vé"}
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {valueType === "currency"
                  ? formatCurrency(item.value || 0)
                  : formatNumber(item.value || 0)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const currentMonthRange = useMemo(() => getCurrentMonthRange(), []);
  const [filters, setFilters] = useState(currentMonthRange);

  const dashboardQuery = useAdminDashboard(filters);

  const dashboard = dashboardQuery.data || {};
  const business = dashboard.business || {};
  const revenue = business.revenue || {};
  const tickets = business.tickets || {};
  const movies = dashboard.movies || {};
  const showtimes = dashboard.showtimes || {};

  const revenueByMovie = normalizeRevenueData(revenue.byMovie);
  const revenueByCinema = normalizeRevenueData(revenue.byCinema);
  const revenueByRoom = normalizeRevenueData(revenue.byRoom);
  const showtimesPerDay = normalizeShowtimePerDay(showtimes.totalPerDay);

  const bestSellingMovies = normalizeRevenueData(movies.bestSellingByRevenue);
  const leastViewedMovie = movies.leastViewedMovie;

  const timeSlotData = [
    {
      name: "Giờ vàng",
      value: Number(revenue.byTimeSlot?.goldenHour || 0),
    },
    {
      name: "Giờ thấp điểm",
      value: Number(revenue.byTimeSlot?.offPeak || 0),
    },
  ].filter((item) => item.value > 0);

  const movieCountData = [
    {
      name: "Đang chiếu",
      value: Number(movies.nowShowingCount || 0),
    },
    {
      name: "Sắp chiếu",
      value: Number(movies.comingSoonCount || 0),
    },
  ].filter((item) => item.value > 0);

  const mostCrowdedShowtime = showtimes.mostCrowdedShowtime;

  function updateFilter(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function applyPreset(type) {
    const now = new Date();

    if (type === "today") {
      const today = toDateInputValue(now);
      setFilters({
        dateFrom: today,
        dateTo: today,
      });
      return;
    }

    if (type === "7days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      setFilters({
        dateFrom: toDateInputValue(from),
        dateTo: toDateInputValue(now),
      });
      return;
    }

    if (type === "month") {
      setFilters(getCurrentMonthRange());
    }
  }

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-52" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} className="h-40" />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        message="Không tải được dữ liệu dashboard"
        onRetry={() => dashboardQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="card-premium relative overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_35%),radial-gradient(circle_at_left,rgba(239,68,68,0.14),transparent_30%)]" />

        <div className="relative">
          <PageHeader
            title="Dashboard quản trị"
            description="Theo dõi doanh thu, vé, phim và suất chiếu theo dữ liệu tổng hợp từ API dashboard mới."
            action={
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(event) =>
                      updateFilter("dateFrom", event.target.value)
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(event) =>
                      updateFilter("dateTo", event.target.value)
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
            }
          />

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset("today")}
              className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
            >
              Hôm nay
            </button>

            <button
              type="button"
              onClick={() => applyPreset("7days")}
              className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
            >
              7 ngày
            </button>

            <button
              type="button"
              onClick={() => applyPreset("month")}
              className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
            >
              Tháng này
            </button>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              API filter: {dashboard.filters?.dateFrom || filters.dateFrom} →{" "}
              {dashboard.filters?.dateTo || filters.dateTo}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={BadgeDollarSign}
              label="Doanh thu ngày"
              value={formatCurrency(revenue.total?.daily || 0)}
              helper="Tổng doanh thu hôm nay"
              tone="amber"
            />

            <StatCard
              icon={BadgeDollarSign}
              label="Doanh thu tuần"
              value={formatCurrency(revenue.total?.weekly || 0)}
              helper="Tổng doanh thu tuần hiện tại"
              tone="emerald"
            />

            <StatCard
              icon={BadgeDollarSign}
              label="Doanh thu tháng"
              value={formatCurrency(revenue.total?.monthly || 0)}
              helper="Tổng doanh thu tháng hiện tại"
              tone="blue"
            />

            <StatCard
              icon={Ticket}
              label="Vé đã bán"
              value={formatNumber(tickets.totalSold || 0)}
              helper="Tổng số vé đã bán"
              tone="red"
            />

            <StatCard
              icon={Percent}
              label="Tỷ lệ lấp đầy"
              value={formatPercent(tickets.seatOccupancyRate || 0)}
              helper="Seat Occupancy Rate"
              tone="violet"
            />

            <StatCard
              icon={BarChart3}
              label="Vé TB / suất"
              value={formatNumber(tickets.averageTicketsPerShowtime || 0)}
              helper="Average Tickets Per Showtime"
              tone="emerald"
            />

            <StatCard
              icon={Ban}
              label="Vé bị hủy"
              value={formatNumber(tickets.canceledTickets || 0)}
              helper="Tổng vé bị hủy"
              tone="red"
            />

            <StatCard
              icon={CalendarRange}
              label="Suất chiếu bị hủy"
              value={formatNumber(showtimes.canceledShowtimes || 0)}
              helper="Tổng suất chiếu bị hủy"
              tone="amber"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Film}
          label="Phim đang chiếu"
          value={formatNumber(movies.nowShowingCount || 0)}
          helper="Số phim đang mở bán"
          tone="emerald"
        />

        <StatCard
          icon={Film}
          label="Phim sắp chiếu"
          value={formatNumber(movies.comingSoonCount || 0)}
          helper="Số phim coming soon"
          tone="blue"
        />

        <StatCard
          icon={Clock3}
          label="Tổng ngày có suất"
          value={formatNumber(showtimesPerDay.length)}
          helper="Số ngày có dữ liệu suất chiếu"
          tone="violet"
        />

        <StatCard
          icon={Trophy}
          label="Top phim doanh thu"
          value={bestSellingMovies[0]?.name || "Chưa có"}
          helper={
            bestSellingMovies[0]
              ? formatCurrency(bestSellingMovies[0].value)
              : "Chưa có doanh thu"
          }
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Doanh thu theo phim"
          description="Top phim có doanh thu cao trong khoảng thời gian đã chọn."
          className="xl:col-span-2"
        >
          <div className="h-80">
            {revenueByMovie.length === 0 ? (
              <EmptyBox text="Chưa có dữ liệu doanh thu theo phim" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMovie}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.2)"
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Doanh thu theo khung giờ"
          description="So sánh giờ vàng và giờ thấp điểm."
        >
          <div className="h-80">
            {timeSlotData.length === 0 ? (
              <EmptyBox text="Chưa có dữ liệu doanh thu theo khung giờ" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeSlotData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {timeSlotData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Doanh thu theo rạp"
          description="Theo dõi rạp có doanh thu tốt nhất."
        >
          <div className="h-80">
            {revenueByCinema.length === 0 ? (
              <EmptyBox text="Chưa có dữ liệu doanh thu theo rạp" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByCinema}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.2)"
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Doanh thu theo phòng"
          description="So sánh doanh thu giữa các phòng chiếu."
        >
          <div className="h-80">
            {revenueByRoom.length === 0 ? (
              <EmptyBox text="Chưa có dữ liệu doanh thu theo phòng" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByRoom}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.2)"
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Tổng suất chiếu mỗi ngày"
          description="Số lượng suất chiếu theo từng ngày."
          className="xl:col-span-2"
        >
          <div className="h-80">
            {showtimesPerDay.length === 0 ? (
              <EmptyBox text="Chưa có dữ liệu suất chiếu mỗi ngày" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={showtimesPerDay}>
                  <defs>
                    <linearGradient
                      id="showtimeFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.7} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.2)"
                  />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="totalShowtimes"
                    stroke="#3b82f6"
                    fill="url(#showtimeFill)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Tình trạng phim"
          description="Phim đang chiếu và sắp chiếu."
        >
          <div className="h-80">
            {movieCountData.length === 0 ? (
              <EmptyBox text="Chưa có dữ liệu phim" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={movieCountData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {movieCountData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SimpleRanking
          title="Phim bán chạy nhất"
          description="Xếp hạng phim theo doanh thu."
          items={bestSellingMovies}
          valueType="currency"
          emptyText="Chưa có dữ liệu phim bán chạy"
        />

        <div className="card-premium p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                Phim ít người xem
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Dùng để xem phim nào cần điều chỉnh lịch chiếu hoặc marketing.
              </p>
            </div>

            <div className="rounded-2xl bg-red-400/15 p-3 text-red-500 dark:bg-red-300/10 dark:text-red-300">
              <TrendingDown size={20} />
            </div>
          </div>

          <div className="mt-5">
            {!leastViewedMovie ? (
              <EmptyBox text="Chưa có dữ liệu phim ít người xem" />
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tên phim
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                  {pickName(leastViewedMovie)}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Số vé / lượt xem
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                      {formatNumber(
                        pickNumber(leastViewedMovie, [
                          "tickets",
                          "ticketCount",
                          "totalTickets",
                          "soldTickets",
                          "views",
                          "seatCount",
                        ]),
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Doanh thu
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                      {formatCurrency(
                        pickNumber(leastViewedMovie, [
                          "revenue",
                          "totalRevenue",
                          "totalAmount",
                          "amount",
                          "value",
                        ]),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card-premium p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                Suất chiếu đông khách nhất
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Suất chiếu có lượng ghế/vé cao nhất trong khoảng lọc.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-500 dark:bg-emerald-300/10 dark:text-emerald-300">
              <Trophy size={20} />
            </div>
          </div>

          <div className="mt-5">
            {!mostCrowdedShowtime ? (
              <EmptyBox text="Chưa có dữ liệu suất chiếu đông khách nhất" />
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Suất chiếu
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                  {pickName(mostCrowdedShowtime)}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Số vé / ghế
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                      {formatNumber(
                        pickNumber(mostCrowdedShowtime, [
                          "tickets",
                          "ticketCount",
                          "totalTickets",
                          "soldTickets",
                          "seatCount",
                        ]),
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Doanh thu
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                      {formatCurrency(
                        pickNumber(mostCrowdedShowtime, [
                          "revenue",
                          "totalRevenue",
                          "totalAmount",
                          "amount",
                          "value",
                        ]),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ChartCard
          title="Doanh thu giờ vàng / thấp điểm"
          description="Biểu đồ line đơn giản để nhìn chênh lệch doanh thu theo khung giờ."
        >
          <div className="h-80">
            {timeSlotData.length === 0 ? (
              <EmptyBox text="Chưa có dữ liệu khung giờ" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSlotData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.2)"
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SimpleRanking
          title="Top rạp theo doanh thu"
          description="Danh sách rạp có doanh thu cao."
          items={revenueByCinema}
          valueType="currency"
          emptyText="Chưa có dữ liệu doanh thu theo rạp"
        />

        <SimpleRanking
          title="Top phòng theo doanh thu"
          description="Danh sách phòng chiếu có doanh thu cao."
          items={revenueByRoom}
          valueType="currency"
          emptyText="Chưa có dữ liệu doanh thu theo phòng"
        />
      </div>
    </div>
  );
}
