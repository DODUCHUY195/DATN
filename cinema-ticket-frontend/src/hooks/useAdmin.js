import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/endpoints';

export const useAdminDashboard = () =>
  useQuery({ queryKey: ['admin-dashboard'], queryFn: async () => (await adminApi.dashboard()).data.data });
export const useAdminUsers = () =>
  useQuery({ queryKey: ['admin-users'], queryFn: async () => (await adminApi.users()).data.data });
export const useAdminMovies = () =>
  useQuery({ queryKey: ['admin-movies'], queryFn: async () => (await adminApi.movies()).data.data });
export const useAdminCinemas = () =>
  useQuery({ queryKey: ['admin-cinemas'], queryFn: async () => (await adminApi.cinemas()).data.data });
export const useAdminRooms = () =>
  useQuery({ queryKey: ['admin-rooms'], queryFn: async () => (await adminApi.rooms()).data.data });
export const useAdminShowtimes = () =>
  useQuery({ queryKey: ['admin-showtimes'], queryFn: async () => (await adminApi.showtimes()).data.data });
export const useAdminBookings = () =>
  useQuery({ queryKey: ['admin-bookings'], queryFn: async () => (await adminApi.bookings()).data.data });

function invalidate(queryClient, keys) {
  keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function useAdminMutations() {
  const queryClient = useQueryClient();
  return {
    lockUser: useMutation({ mutationFn: ({ id, payload }) => adminApi.lockUser(id, payload), onSuccess: () => invalidate(queryClient, ['admin-users']) }),
    createMovie: useMutation({ mutationFn: (payload) => adminApi.createMovie(payload), onSuccess: () => invalidate(queryClient, ['admin-movies']) }),
    updateMovie: useMutation({ mutationFn: ({ id, payload }) => adminApi.updateMovie(id, payload), onSuccess: () => invalidate(queryClient, ['admin-movies']) }),
    deleteMovie: useMutation({ mutationFn: (id) => adminApi.deleteMovie(id), onSuccess: () => invalidate(queryClient, ['admin-movies']) }),
    createCinema: useMutation({ mutationFn: adminApi.createCinema, onSuccess: () => invalidate(queryClient, ['admin-cinemas']) }),
    createRoom: useMutation({ mutationFn: adminApi.createRoom, onSuccess: () => invalidate(queryClient, ['admin-rooms', 'admin-cinemas']) }),
    configureSeats: useMutation({ mutationFn: ({ roomId, payload }) => adminApi.configureSeats(roomId, payload), onSuccess: () => invalidate(queryClient, ['admin-rooms']) }),
    createShowtime: useMutation({ mutationFn: adminApi.createShowtime, onSuccess: () => invalidate(queryClient, ['admin-showtimes']) }),
    updateShowtime: useMutation({ mutationFn: ({ id, payload }) => adminApi.updateShowtime(id, payload), onSuccess: () => invalidate(queryClient, ['admin-showtimes']) }),
    deleteShowtime: useMutation({ mutationFn: (id) => adminApi.deleteShowtime(id), onSuccess: () => invalidate(queryClient, ['admin-showtimes']) }),
    confirmBooking: useMutation({ mutationFn: (id) => adminApi.confirmBooking(id), onSuccess: () => invalidate(queryClient, ['admin-bookings', 'admin-dashboard']) }),
    cancelBooking: useMutation({ mutationFn: (id) => adminApi.cancelBooking(id), onSuccess: () => invalidate(queryClient, ['admin-bookings', 'admin-dashboard']) }),
  };
}
