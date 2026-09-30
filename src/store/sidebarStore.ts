import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  isMobileMenuOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true, // Desktop: expanded by default
  isMobileMenuOpen: false,

  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
