// import { Link } from "react-router-dom";
// import { Clock3, PlayCircle } from "lucide-react";
// import { formatDate } from "../../utils/format";
// import {BASE_URL_API} from '../../constants/env'

// export default function MovieCard({ movie }) {
//   return (
//     <article className="card overflow-hidden">
//       <div className="aspect-square bg-slate-200 relative">
//         {movie.posterUrl ? (
//           <img
//             // src={movie.posterUrl}
//             src={`${BASE_URL_API ?? "http://localhost:3000"}${movie.posterUrl}`}
//             alt={movie.title}
//             className="h-full w-full object-cover"
//           />
//         ) : (
//           <div className="flex h-full items-center justify-center text-slate-500">
//             No poster
//           </div>
//         )}
//         <span
//           className={`block absolute top-5 right-5 text-sm badge ${movie.status === "NOW_SHOWING" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
//         >
//           {movie.status === "NOW_SHOWING" ? "Đang chiếu" : "Sắp chiếu"}
//         </span>
//       </div>
//       <div className="space-y-4 p-4">
//         <div>
//           <h3 className="line-clamp-1 text-md font-bold text-slate-900">
//             {movie.title}
//           </h3>
//           <p className="mt-1 text-xs text-slate-500">
//             Khởi chiếu: {formatDate(movie.releaseDate)}
//           </p>
//         </div>
//         <p className="line-clamp-2 text-sm text-slate-600">
//           {movie.description || "Chưa có mô tả cho phim này."}
//         </p>
//         <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
//           <span className="inline-flex items-center gap-2">
//             <Clock3 size={16} /> {movie.durationMinutes} phút
//           </span>
//           {movie.trailerUrl && (
//             <a
//               href={movie.trailerUrl}
//               target="_blank"
//               rel="noreferrer"
//               className="inline-flex items-center gap-2 font-medium text-brand-600"
//             >
//               <PlayCircle size={16} /> Trailer
//             </a>
//           )}
//         </div>
//         <Link className="btn-primary w-full text-white" to={`/movies/${movie.id}`}>
//           Xem chi tiết
//         </Link>
//       </div>
//     </article>
//   );
// }

// import { Link } from "react-router-dom";
// import { Clock3, PlayCircle } from "lucide-react";
// import { formatDate } from "../../utils/format";
// import { BASE_URL_API } from "../../constants/env";

// export default function MovieCard({ movie }) {
//   return (
//     <article className="card overflow-hidden">
//       <div className="aspect-square bg-slate-200 relative">
//         {movie.posterUrl ? (
//           <img
//             src={`${BASE_URL_API ?? 'http://localhost:3000'}${movie.posterUrl}`}
//             // src={movie.posterUrl}
//             alt={movie.title}
//             className="h-full w-full object-cover"
//           />
//         ) : (
//           <div className="flex h-full items-center justify-center text-slate-500">
//             No poster
//           </div>
//         )}
//         <span
//           className={`block absolute top-5 right-5 text-sm badge ${movie.status === "NOW_SHOWING" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
//         >
//           {movie.status === "NOW_SHOWING" ? "Đang chiếu" : "Sắp chiếu"}
//         </span>
//       </div>
//       <div className="space-y-4 p-4">
//         <div>
//           <h3 className="line-clamp-1 text-md font-bold text-slate-900">
//             {movie.title}
//           </h3>
//           <p className="mt-1 text-xs text-slate-500">
//             Khởi chiếu: {formatDate(movie.releaseDate)}
//           </p>
//         </div>
//         <p className="line-clamp-2 text-sm text-slate-600">
//           {movie.description || "Chưa có mô tả cho phim này."}
//         </p>
//         <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
//           <span className="inline-flex items-center gap-2">
//             <Clock3 size={16} /> {movie.durationMinutes} phút
//           </span>
//           {movie.trailerUrl && (
//             <a
//               href={movie.trailerUrl}
//               target="_blank"
//               rel="noreferrer"
//               className="inline-flex items-center gap-2 font-medium text-brand-600"
//             >
//               <PlayCircle size={16} /> Trailer
//             </a>
//           )}
//         </div>
//         <Link className="btn-primary w-full text-white" to={`/movies/${movie.id}`}>
//           Xem chi tiết
//         </Link>
//       </div>
//     </article>
//   );
// }


import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, PlayCircle } from "lucide-react";
import { formatDate } from "../../utils/format";
import { BASE_URL_API } from "../../constants/env";
import Modal from "../../components/ui/Modal";

export default function MovieCard({ movie }) {
  const [openTrailer, setOpenTrailer] = useState(false);

  const posterSrc = movie?.posterUrl
    ? `${BASE_URL_API ?? "http://localhost:3000"}${movie.posterUrl}`
    : null;

  const trailerSrc = useMemo(() => {
    if (!movie?.trailerUrl) return "";

    if (/^https?:\/\//i.test(movie.trailerUrl)) {
      return movie.trailerUrl;
    }

    return `${BASE_URL_API ?? "http://localhost:3000"}${movie.trailerUrl}`;
  }, [movie?.trailerUrl]);

  return (
    <>
      <article className="card overflow-hidden">
        <div className="aspect-square relative bg-slate-200">
          {posterSrc ? (
            <img
              src={posterSrc}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              No poster
            </div>
          )}

          <span
            className={`absolute right-5 top-5 block text-sm badge ${
              movie.status === "NOW_SHOWING"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
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

            {movie.trailerUrl ? (
              <button
                type="button"
                onClick={() => setOpenTrailer(true)}
                className="inline-flex items-center gap-2 font-medium text-brand-600 hover:underline"
              >
                <PlayCircle size={16} /> Trailer
              </button>
            ) : null}
          </div>

          <Link className="btn-primary w-full text-white" to={`/movies/${movie.id}`}>
            Xem chi tiết
          </Link>
        </div>
      </article>

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
    </>
  );
}