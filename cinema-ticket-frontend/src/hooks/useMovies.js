import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '../api/endpoints';

export const useMovies = (params) =>
  useQuery({
    queryKey: ['movies', params],
    queryFn: async () => (await moviesApi.list(params)).data.data,
  });

export const useMovieDetail = (id) =>
  useQuery({
    queryKey: ['movie-detail', id],
    queryFn: async () => (await moviesApi.detail(id)).data.data,
    enabled: Boolean(id),
  });
