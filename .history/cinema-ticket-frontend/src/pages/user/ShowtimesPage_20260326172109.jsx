

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import CustomSelect from "../../components/ui/CustomSelect";
import { useShowtimes } from "../../hooks/useShowtimes";
import { useMovies } from "../../hooks/useMovies";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { BASE_URL_API } from "../../constants/env";

const TIME_SLOT_OPTIONS = [
  { value: "", label: "Tất cả khung giờ" },
  { value: "9-12", label: "Sáng (09:00 - 12:00)", icon: "🌤️" },
  { value: "12-18", label: "Chiều (12:00 - 18:00)", icon: "☀️" },
  { value: "18-24", label: "Tối (18:00 - 24:00)", icon: "🌙" },
];

export default function ShowtimesPage() {
  const [filters, setFilters] = useState({
    date: "",
    roomId: "",
    movieId: "",
    timeSlot: "",
  });

  const queryParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== "" && value !== null && value !== undefined,
        ),
      ),
    [filters],
  );

  const showtimesQuery = useShowtimes(queryParams);
  const moviesQuery = useMovies();

  // Query public để gom room option cho user chọn
  // Có thể giữ theo ngày để room list bám đúng ngày đang lọc
  const roomSourceQuery = useShowtimes(
    filters.date ? { date: filters.date } : {},
  );

  const movieOptions = useMemo(() => {
    const movies = moviesQuery.data || [];
    return [
      { value: "", label: "Tất cả phim" },
      ...movies.map((movie) => ({
        value: String(movie.id),
        label: movie.title,
        icon: "🎬",
        meta: movie.durationMinutes
          ? `${movie.durationMinutes} phút`
          : undefined,
      })),
    ];
  }, [moviesQuery.data]);

  const roomOptions = useMemo(() => {
    const showtimes = roomSourceQuery.data || [];

    const uniqueRoomsMap = new Map();

    showtimes.forEach((showtime) => {
      const room = showtime.Room;
      if (!room?.id) return;

      if (!uniqueRoomsMap.has(room.id)) {
        uniqueRoomsMap.set(room.id, {
          value: String(room.id),
          label: room.name || `Phòng ${room.id}`,
          icon: "🎟️",
          meta: room.Cinema?.name || "",
        });
      }
    });

    return [
      { value: "", label: "Tất cả phòng" },
      ...Array.from(uniqueRoomsMap.values()),
    ];
  }, [roomSourceQuery.data]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value ?? "",
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Lịch chiếu" />

      <div className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        {/* <div className="space-y-2">
          <label className="label">Ngày chiếu</label>
          <input
            type="date"
            className="input"
            value={filters.date}
            onChange={(e) => handleFilterChange("date", e.target.value)}
          />
        </div> */}

        <div className="space-y-2">
          <label className="label">Phim</label>
          <CustomSelect
            value={filters.movieId}
            onChange={(value) => handleFilterChange("movieId", value)}
            options={movieOptions}
            placeholder="Chọn phim"
            searchable
            clearable
            loading={moviesQuery.isLoading}
            multiple
          />
        </div>

        <div className="space-y-2">
          <label className="label">Phòng chiếu</label>
          <CustomSelect
            value={filters.roomId}
            onChange={(value) => handleFilterChange("roomId", value)}
            options={roomOptions}
            placeholder="Chọn phòng"
            searchable
            clearable
            loading={roomSourceQuery.isLoading}
            multiple
          />
        </div>

        <div className="space-y-2">
          <label className="label">Khung giờ</label>
          <CustomSelect
            value={filters.timeSlot}
            onChange={(value) => handleFilterChange("timeSlot", value)}
            options={TIME_SLOT_OPTIONS}
            placeholder="Chọn khung giờ"
            clearable
            multiple
          />
        </div>
      </div>

      {showtimesQuery.isLoading ? (
        <LoadingSpinner />
      ) : showtimesQuery.isError ? (
        <ErrorState
          message="Không tải được lịch chiếu"
          onRetry={showtimesQuery.refetch}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {showtimesQuery.data?.length ? (
            showtimesQuery.data?.slice(0, 6).map((showtime) => (
              <div className="card-premium flex overflow-hidden" key={showtime.id}>
                <div className="w-36 shrink-0 relative flex items-center justify-center">
                  {showtime.Movie?.posterUrl ? (
                    <img
                      // src={showtime.Movie?.posterUrl}
                      src={`${BASE_URL_API ?? "http://localhost:3000"}${showtime.Movie?.posterUrl}`}
                      alt={showtime.Movie?.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      No poster
                    </div>
                  )}
                  <span className="block absolute badge bg-brand-50 text-brand-700">
                    {showtime.status}
                  </span>
                </div>
                <div className="p-4 w-full flex flex-col" key={showtime.id}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {showtime.Movie?.title}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {showtime.Room?.Cinema?.name} · {showtime.Room?.name}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-600">
                    {formatDateTime(showtime.startTime)}
                  </p>
                  <div className="text-lg font-bold text-brand-600">
                    {formatCurrency(showtime.basePrice)}
                  </div>
                  <Link
                    to={`/booking/${showtime.id}`}
                    className="mt-auto btn-primary w-full"
                  >
                    Đặt ngay
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="card col-span-full p-8 text-center text-slate-500">
              Không có lịch chiếu phù hợp
            </div>
          )}
        </div>
      )}
    </div>
  );
}
