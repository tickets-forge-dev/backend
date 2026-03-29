/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { User } from 'firebase/auth';
import { SignInUseCase } from '@/src/auth/application/sign-in.use-case';
import { SignOutUseCase } from '@/src/auth/application/sign-out.use-case';
import { useServices } from '@/services/index';
import {
  auth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  getMagicLinkActionCodeSettings,
} from '@/lib/firebase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  hasTeams: boolean | null;
  teamCount: number;
  currentTeamId: string | null;

  // Magic link state
  magicLinkSent: boolean;
  magicLinkEmail: string | null;
  magicLinkNeedsEmail: boolean;

  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;

  // Magic link actions
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (url: string) => Promise<void>;
  resetMagicLink: () => void;
}

function getMagicLinkErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/quota-exceeded':
      return 'Too many requests. Please try again later.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This link has expired or already been used. Please request a new one.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  hasTeams: null,
  teamCount: 0,
  currentTeamId: null,
  magicLinkSent: false,
  magicLinkEmail: null,
  magicLinkNeedsEmail: false,

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
      if (error.message?.includes('already linked')) {
        console.warn('[AuthStore] Account linking notice:', error.message);
      } else {
        console.error('[AuthStore] signInWithGoogle error:', error);
      }
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
      if (error.message?.includes('already linked')) {
        console.warn('[AuthStore] Account linking notice:', error.message);
      } else {
        console.error('[AuthStore] signInWithGitHub error:', error);
      }
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

  sendMagicLink: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const actionCodeSettings = getMagicLinkActionCodeSettings();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem('forgeEmailForSignIn', email);
      set({
        isLoading: false,
        magicLinkSent: true,
        magicLinkEmail: email,
      });
    } catch (error: any) {
      console.error('[AuthStore] sendMagicLink error:', error);
      const message = getMagicLinkErrorMessage(error.code);
      set({ isLoading: false, error: message });
    }
  },

  completeMagicLinkSignIn: async (url: string) => {
    if (!isSignInWithEmailLink(auth, url)) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      let email = localStorage.getItem('forgeEmailForSignIn');

      if (!email) {
        set({ isLoading: false, magicLinkNeedsEmail: true });
        return;
      }

      await signInWithEmailLink(auth, email, url);
      localStorage.removeItem('forgeEmailForSignIn');

      // Initialize workspace (same as OAuth flow)
      const { authService } = useServices();
      const result = await authService.initializeWorkspace();
      set({
        isLoading: false,
        magicLinkSent: false,
        magicLinkEmail: null,
        magicLinkNeedsEmail: false,
        hasTeams: result.hasTeams,
        teamCount: result.teamCount,
        currentTeamId: result.currentTeamId,
      });
    } catch (error: any) {
      console.error('[AuthStore] completeMagicLinkSignIn error:', error);
      const message = getMagicLinkErrorMessage(error.code);
      set({ isLoading: false, error: message });
    }
  },

  resetMagicLink: () => {
    set({
      magicLinkSent: false,
      magicLinkEmail: null,
      magicLinkNeedsEmail: false,
      error: null,
    });
  },
}));
