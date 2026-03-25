import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi, usersApi } from '../api/endpoints';
import { useAuthStore } from '../stores/authStore';

export function useCurrentUser(options = {}) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await usersApi.me()).data.data,
    enabled: Boolean(token),
    ...options,
  });
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: async (payload) => (await authApi.login(payload)).data,
    onSuccess: (response) => {
      setAuth({ user: response.data.user, token: response.data.accessToken });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload) => (await authApi.register(payload)).data,
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  return useMutation({
    mutationFn: async () => authApi.logout(),
    onSettled: () => clearAuth(),
  });
}
