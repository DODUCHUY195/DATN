import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, usersApi } from '../api/endpoints';

export const useMyBookings = () =>
  useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => (await usersApi.bookings()).data.data,
  });

export const useMyHistory = () =>
  useQuery({
    queryKey: ['my-history'],
    queryFn: async () => (await usersApi.history()).data.data,
  });

export const useBookingDetail = (id) =>
  useQuery({
    queryKey: ['booking-detail', id],
    queryFn: async () => (await bookingsApi.detail(id)).data.data,
    enabled: Boolean(id),
  });

export const useHoldBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await bookingsApi.hold(payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seat-map'] }),
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => (await bookingsApi.confirmPayment(id, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-history'] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await bookingsApi.cancel(id)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-history'] });
    },
  });
};
