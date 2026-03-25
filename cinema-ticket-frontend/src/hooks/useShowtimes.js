import { useQuery } from '@tanstack/react-query';
import { showtimesApi } from '../api/endpoints';

export const useShowtimes = (params) =>
  useQuery({
    queryKey: ['showtimes', params],
    queryFn: async () => (await showtimesApi.list(params)).data.data,
  });

export const useSeatMap = (id, options = {}) =>
  useQuery({
    queryKey: ['seat-map', id],
    queryFn: async () => (await showtimesApi.seats(id)).data.data,
    enabled: Boolean(id),
    refetchInterval: 10000,
    ...options,
  });
