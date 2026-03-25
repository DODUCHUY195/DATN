import { create } from 'zustand';

const initialTheme = (() => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('cinema-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    localStorage.setItem('cinema-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('cinema-theme', nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      return { theme: nextTheme };
    }),
}));
