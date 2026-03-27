import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import MovieCard from '../../components/movie/MovieCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { useMovies } from '../../hooks/useMovies';

export default function MoviesPage() {
  const [status, setStatus] = useState('NOW_SHOWING');
  const moviesQuery = useMovies({ status });

  return (
    <div>
      <PageHeader
        title="Danh sách phim"
        // description="Giao diện movie listing có filter trạng thái, responsive và cache bởi React Query."
        action={
          <div className="flex gap-2">
            <button className={status === 'NOW_SHOWING' ? 'btn-primary' : 'btn-secondary'} onClick={() => setStatus('NOW_SHOWING')}>Đang chiếu</button>
            <button className={status === 'COMING_SOON' ? 'btn-primary' : 'btn-secondary'} onClick={() => setStatus('COMING_SOON')}>Sắp chiếu</button>
          </div>
        }
      />
      {moviesQuery.isLoading ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}</div> : moviesQuery.isError ? <ErrorState message="Không tải được danh sách phim" onRetry={moviesQuery.refetch} /> : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {moviesQuery.data?.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
        </div>
      )}
    </div>
  );
}
