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

function isSameDate(dateValue, selectedDate) {
  if (!selectedDate) return true;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}` === selectedDate;
}

function isInTimeSlot(dateValue, timeSlot) {
  if (!timeSlot) return true;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const hour = date.getHours();

  if (timeSlot === "9-12") return hour >= 9 && hour < 12;
  if (timeSlot === "12-18") return hour >= 12 && hour < 18;
  if (timeSlot === "18-24") return hour >= 18 && hour < 24;

  return true;
}

export default function ShowtimesPage() {
  const [filters, setFilters] = useState({
    date: "",
    roomId: "",
    movieId: "",
    timeSlot: "",
  });

  const showtimesQuery = useShowtimes();
  const moviesQuery = useMovies();

  const allShowtimes = showtimesQuery.data || [];

  const baseFilteredByDate = useMemo(() => {
    return allShowtimes.filter((showtime) =>
      isSameDate(showtime.startTime, filters.date),
    );
  }, [allShowtimes, filters.date]);

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
    const uniqueRoomsMap = new Map();

    baseFilteredByDate.forEach((showtime) => {
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
  }, [baseFilteredByDate]);

  const filteredShowtimes = useMemo(() => {
    return allShowtimes.filter((showtime) => {
      const movieOk =
        !filters.movieId ||
        String(showtime.movieId ?? showtime.Movie?.id ?? "") ===
          String(filters.movieId);

      const roomOk =
        !filters.roomId ||
        String(showtime.roomId ?? showtime.Room?.id ?? "") ===
          String(filters.roomId);

      const dateOk = isSameDate(showtime.startTime, filters.date);
      const timeOk = isInTimeSlot(showtime.startTime, filters.timeSlot);

      return movieOk && roomOk && dateOk && timeOk;
    });
  }, [allShowtimes, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value ?? "",
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      date: "",
      roomId: "",
      movieId: "",
      timeSlot: "",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Lịch chiếu" />

      <div className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="label">Ngày chiếu</label>
          <input
            type="date"
            className="input"
            value={filters.date}
            onChange={(e) => handleFilterChange("date", e.target.value)}
          />
        </div>

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
            loading={showtimesQuery.isLoading}
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
          />
        </div>

        <div className="md:col-span-2 xl:col-span-4 flex justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleResetFilters}
          >
            Xóa bộ lọc
          </button>
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
          {filteredShowtimes.length ? (
            filteredShowtimes.map((showtime) => (
              <div
                className="card-premium flex overflow-hidden"
                key={showtime.id}
              >
                <div className="relative flex w-36 shrink-0 items-center justify-center">
                  {showtime.Movie?.posterUrl ? (
                    <img
                      src={`${BASE_URL_API ?? "http://localhost:3000"}${
                        showtime.Movie?.posterUrl
                      }`}
                      alt={showtime.Movie?.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      No poster
                    </div>
                  )}

                  <span className="absolute badge bg-brand-50 text-brand-700">
                    {showtime.status}
                  </span>
                </div>

                <div className="flex w-full flex-col p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {showtime.Movie?.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-500">
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
                    className="btn-primary mt-auto w-full"
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