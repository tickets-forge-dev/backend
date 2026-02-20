/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { User } from 'firebase/auth';
import { SignInUseCase } from '@/src/auth/application/sign-in.use-case';
import { SignOutUseCase } from '@/src/auth/application/sign-out.use-case';
import { useServices } from '@/services/index';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  hasTeams: boolean | null;
  teamCount: number;
  currentTeamId: string | null;

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
  hasTeams: null,
  teamCount: 0,
  currentTeamId: null,

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      const { authService } = useServices();
      const signInUseCase = new SignInUseCase(authService);
      const result = await signInUseCase.signInWithGoogle();
      set({
        isLoading: false,
        hasTeams: result.hasTeams,
        teamCount: result.teamCount,
        currentTeamId: result.currentTeamId
      });
    } catch (error: any) {
      console.error('❌ [AuthStore] signInWithGoogle error:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  signInWithGitHub: async () => {
    set({ isLoading: true, error: null });

    try {
      const { authService } = useServices();
      const signInUseCase = new SignInUseCase(authService);
      const result = await signInUseCase.signInWithGitHub();
      set({
        isLoading: false,
        hasTeams: result.hasTeams,
        teamCount: result.teamCount,
        currentTeamId: result.currentTeamId
      });
    } catch (error: any) {
      console.error('❌ [AuthStore] signInWithGitHub error:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  signOut: async () => {
    try {
      const signOutUseCase = new SignOutUseCase();
      await signOutUseCase.execute();
      set({ user: null });
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
