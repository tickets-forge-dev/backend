import { create } from 'zustand';
import { User } from 'firebase/auth';
import { SignInUseCase } from '@/src/auth/application/sign-in.use-case';
import { SignOutUseCase } from '@/src/auth/application/sign-out.use-case';
import { useServices } from '@/services/index';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  handleRedirectResult: () => Promise<boolean>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signInWithGoogle: async () => {
    console.log('📦 [AuthStore] signInWithGoogle called');
    set({ isLoading: true, error: null });

    try {
      const { authService } = useServices();
      const signInUseCase = new SignInUseCase(authService);
      await signInUseCase.signInWithGoogle();
    } catch (error: any) {
      console.error('❌ [AuthStore] signInWithGoogle error:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  signInWithGitHub: async () => {
    console.log('📦 [AuthStore] signInWithGitHub called');
    set({ isLoading: true, error: null });

    try {
      const { authService } = useServices();
      const signInUseCase = new SignInUseCase(authService);
      await signInUseCase.signInWithGitHub();
    } catch (error: any) {
      console.error('❌ [AuthStore] signInWithGitHub error:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  handleRedirectResult: async () => {
    console.log('📦 [AuthStore] handleRedirectResult called');
    try {
      const { authService } = useServices();
      const signInUseCase = new SignInUseCase(authService);
      const result = await signInUseCase.handleRedirectResult();
      console.log('📦 [AuthStore] handleRedirectResult result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [AuthStore] handleRedirectResult error:', error);
      set({ error: error.message });
      return false;
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
