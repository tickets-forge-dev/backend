import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  onboardingCompleted: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  completeOnboarding: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      onboardingCompleted: false,
      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),
      completeOnboarding: () =>
        set({ onboardingCompleted: true }),
    }),
    {
      name: 'forge-ui-preferences',
    }
  )
);
