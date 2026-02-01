import { create } from 'zustand';
import { User } from 'firebase/auth';
import { useServices } from '@/services/index';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      const { authService } = useServices();
      const user = await authService.signInWithGoogle();

      set({ user, isLoading: false });

      // Initialize workspace on backend (first login or existing)
      await authService.initializeWorkspace();

      // Navigate to tickets (will be done in component)
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  signInWithGitHub: async () => {
    set({ isLoading: true, error: null });

    try {
      const { authService } = useServices();
      const user = await authService.signInWithGitHub();

      set({ user, isLoading: false });

      // Initialize workspace on backend
      await authService.initializeWorkspace();

      // Navigate to tickets (will be done in component)
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  signOut: async () => {
    try {
      const { authService } = useServices();
      await authService.signOut();

      set({ user: null });

      // Navigate to login (will be done in component)
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },
}));
