import { Link } from "react-router-dom";
import MovieCard from "../../components/movie/MovieCard";
import { CardSkeleton } from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import { useMovies } from "../../hooks/useMovies";
import { useShowtimes } from "../../hooks/useShowtimes";
import { formatDateTime } from "../../utils/format";
import { BASE_URL_API } from "../../constants/env";

export default function HomePage() {
  const moviesQuery = useMovies({ status: "NOW_SHOWING" });
  const showtimesQuery = useShowtimes({});
  console.log("showtimesQuery", showtimesQuery.data);
  return (
    <div className="space-y-10">
      <section className="card-premium overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_20%),linear-gradient(120deg,#020617,#7f1d1d)] p-8 text-white md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">
              Cinema booking platform
            </p>
            <h1 className="mt-4 text-4xl font-bold md:text-5xl">
              Đặt vé xem phim hiện đại, mượt và trực quan.
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              Khám phá phim đang chiếu, chọn suất, giữ ghế trong thời gian thực
              và thanh toán demo nhanh chóng.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/movies"
                className="btn bg-white text-slate-900 hover:bg-slate-100"
              >
                Khám phá phim
              </Link>
              <Link
                to="/showtimes"
                className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                Xem lịch chiếu
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <div className="text-sm text-white/70">Giữ ghế tạm thời</div>
              <div className="mt-2 text-3xl font-bold">5–10 phút</div>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <div className="text-sm text-white/70">Thanh toán demo</div>
              <div className="mt-2 text-3xl font-bold">QR / mã vé</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Phim đang chiếu
            </h2>
            {/* <p className="text-sm text-slate-500">Những bộ phim nổi bật dành cho người dùng đặt vé nhanh.</p> */}
          </div>
          <Link to="/movies" className="text-sm font-semibold text-brand-600">
            Xem tất cả
          </Link>
        </div>
        {moviesQuery.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : moviesQuery.isError ? (
          <ErrorState
            message="Không thể tải danh sách phim"
            onRetry={moviesQuery.refetch}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {moviesQuery.data?.slice(0, 4).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Suất chiếu nổi bật
            </h2>
            {/* <p className="text-sm text-slate-500">Hiển thị lịch chiếu đang active từ backend.</p> */}
          </div>
          <Link
            to="/showtimes"
            className="text-sm font-semibold text-brand-600"
          >
            Lọc lịch chiếu
          </Link>
        </div>
        {showtimesQuery.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} className="h-72" />
            ))}
          </div>
        ) : showtimesQuery.isError ? (
          <ErrorState
            message="Không thể tải suất chiếu"
            onRetry={showtimesQuery.refetch}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {showtimesQuery.data?.slice(0, 6).map((showtime) => (
              <div className="card-premium flex">
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
                  <Link
                    to={`/booking/${showtime.id}`}
                    className="mt-auto btn-primary w-full"
                  >
                    Đặt ngay
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
