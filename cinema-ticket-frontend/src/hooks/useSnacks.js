import { useQuery } from '@tanstack/react-query';
import { snacksApi } from '../api/endpoints';

export const useSnacks = () =>
  useQuery({
    queryKey: ['snacks'],
    queryFn: async () => (await snacksApi.list()).data.data,
    staleTime: 1000 * 60 * 10,
  });
