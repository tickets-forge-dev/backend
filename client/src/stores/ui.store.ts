import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  onboardingCompleted: boolean;
  commandPaletteOpen: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      onboardingCompleted: false,
      commandPaletteOpen: false,
      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),
      completeOnboarding: () =>
        set({ onboardingCompleted: true }),
      resetOnboarding: () =>
        set({ onboardingCompleted: false }),
      setCommandPaletteOpen: (open: boolean) =>
        set({ commandPaletteOpen: open }),
    }),
    {
      name: 'forge-ui-preferences',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);
