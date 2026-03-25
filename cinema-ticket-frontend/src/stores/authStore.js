import { create } from 'zustand';

const persistedUser = localStorage.getItem('cinema_user');
const persistedToken = localStorage.getItem('cinema_token');

export const useAuthStore = create((set) => ({
  user: persistedUser ? JSON.parse(persistedUser) : null,
  token: persistedToken || '',
  setAuth: ({ user, token }) => {
    localStorage.setItem('cinema_user', JSON.stringify(user));
    localStorage.setItem('cinema_token', token);
    set({ user, token });
  },
  clearAuth: () => {
    localStorage.removeItem('cinema_user');
    localStorage.removeItem('cinema_token');
    set({ user: null, token: '' });
  },
}));
