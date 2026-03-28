import { Link } from "react-router-dom";
import { Clock3, PlayCircle } from "lucide-react";
import { formatDate } from "../../utils/format";

export default function MovieCard({ movie }) {
  return (
    <article className="card overflow-hidden">
      <div className="aspect-square bg-slate-200 relative">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            No poster
          </div>
        )}
        <span
          className={`block absolute top-5 right-5 text-sm badge ${movie.status === "NOW_SHOWING" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
        >
          {movie.status === "NOW_SHOWING" ? "Đang chiếu" : "Sắp chiếu"}
        </span>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h3 className="line-clamp-1 text-md font-bold text-slate-900">
            {movie.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Khởi chiếu: {formatDate(movie.releaseDate)}
          </p>
        </div>
        <p className="line-clamp-2 text-sm text-slate-600">
          {movie.description || "Chưa có mô tả cho phim này."}
        </p>
        <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Clock3 size={16} /> {movie.durationMinutes} phút
          </span>
          {movie.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-medium text-brand-600"
            >
              <PlayCircle size={16} /> Trailer
            </a>
          )}
        </div>
        <Link className="btn-primary w-full text-white" to={`/movies/${movie.id}`}>
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}
