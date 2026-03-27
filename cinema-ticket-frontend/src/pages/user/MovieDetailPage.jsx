


import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { useMovieDetail } from "../../hooks/useMovies";
import { useShowtimes } from "../../hooks/useShowtimes";
import { formatDate, formatDateTime, formatCurrency } from "../../utils/format";
import { BASE_URL_API } from "../../constants/env";
import Modal from '../../components/ui/Modal'

export default function MovieDetailPage() {
  const { id } = useParams();
  const [openTrailer, setOpenTrailer] = useState(false);

  const movieQuery = useMovieDetail(id);
  const showtimesQuery = useShowtimes({ movieId: id });

  const showtimes = useMemo(
    () => showtimesQuery.data || [],
    [showtimesQuery.data]
  );

  if (movieQuery.isLoading) {
    return <LoadingSpinner text="Đang tải chi tiết phim..." />;
  }

  if (movieQuery.isError) {
    return (
      <ErrorState
        message="Không tải được chi tiết phim"
        onRetry={movieQuery.refetch}
      />
    );
  }

  const movie = movieQuery.data;
  const baseUrl = BASE_URL_API ?? "http://localhost:3000";

  const posterSrc = movie?.posterUrl
    ? `${baseUrl}${movie.posterUrl}`
    : null;

  const trailerSrc = movie?.trailerUrl
    ? /^https?:\/\//i.test(movie.trailerUrl)
      ? movie.trailerUrl
      : `${baseUrl}${movie.trailerUrl}`
    : "";

  return (
    <div className="space-y-8">
      <div className="card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="aspect-[3/4] bg-slate-100">
            {posterSrc ? (
              <img
                src={posterSrc}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                No poster
              </div>
            )}
          </div>

          <div className="p-6 lg:p-8">
            <span
              className={`badge ${
                movie.status === "NOW_SHOWING"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {movie.status}
            </span>

            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {movie.title}
            </h1>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Khởi chiếu</p>
                <p className="mt-1 font-semibold">
                  {formatDate(movie.releaseDate)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Thời lượng</p>
                <p className="mt-1 font-semibold">
                  {movie.durationMinutes} phút
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Trailer</p>

                {movie.trailerUrl ? (
                  <button
                    type="button"
                    className="mt-1 inline-block font-semibold text-brand-600 hover:underline"
                    onClick={() => setOpenTrailer(true)}
                  >
                    Xem trailer
                  </button>
                ) : (
                  <p className="mt-1 font-semibold text-slate-400">
                    Chưa có trailer
                  </p>
                )}
              </div>
            </div>

            <p className="mt-6 leading-7 text-slate-600">
              {movie.description || "Chưa có mô tả."}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Lịch chiếu của phim</h2>

        {showtimesQuery.isLoading ? (
          <LoadingSpinner />
        ) : showtimesQuery.isError ? (
          <ErrorState
            message="Không tải được lịch chiếu"
            onRetry={showtimesQuery.refetch}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {showtimes.map((showtime) => (
              <div className="card p-5" key={showtime.id}>
                <p className="font-semibold text-slate-900">
                  {showtime.Room?.Cinema?.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {showtime.Room?.name}
                </p>

                <p className="mt-4 text-sm text-slate-600">
                  {formatDateTime(showtime.startTime)}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Giá từ {formatCurrency(showtime.basePrice)}
                </p>

                <Link
                  to={`/booking/${showtime.id}`}
                  className="btn-primary mt-4 w-full"
                >
                  Chọn ghế
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={openTrailer}
        onClose={() => setOpenTrailer(false)}
        title={`Trailer - ${movie.title}`}
        // subtitle={movie.trailerUrl || "Video trailer"}
        width="max-w-5xl"
      >
        {trailerSrc ? (
          <video
            key={trailerSrc}
            className="h-auto max-h-[70vh] w-full rounded-2xl bg-black"
            controls
            playsInline
            preload="metadata"
          >
            <source src={trailerSrc} type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ phát video.
          </video>
        ) : (
          <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-500">
            Không có trailer để phát.
          </div>
        )}
      </Modal>
    </div>
  );
}