import { create } from 'zustand';

export const useUiStore = create((set) => ({
  adminSidebarCollapsed: false,
  setAdminSidebarCollapsed: (value) => set({ adminSidebarCollapsed: value }),
  toggleAdminSidebar: () => set((state) => ({ adminSidebarCollapsed: !state.adminSidebarCollapsed })),
}));
