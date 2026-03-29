/* eslint-disable react-hooks/rules-of-hooks -- Zustand store: useServices() is lazy service access, not a React hook */
import { create } from 'zustand';
import { OnboardingService, OnboardingState, OnboardingProgress } from '@/services/onboarding.service';

interface OnboardingStore {
  // State
  currentState: OnboardingState;
  teamId: string | null;
  teamName: string | null;
  role: 'admin' | 'developer' | 'pm' | 'qa' | null;
  firstName: string | null;
  lastName: string | null;
  avatarEmoji: string | null;
  hasGitHub: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  enterProfileSetup: () => void;
  completeProfile: (firstName: string, lastName: string, avatarEmoji?: string) => void;
  createTeam: (teamId: string, teamName: string) => void;
  selectRole: (role: 'admin' | 'developer' | 'pm' | 'qa') => void;
  setupGitHub: () => void;
  completeOnboarding: () => void;
  resumeFromStorage: () => void;
  reset: () => void;
}

const onboardingService = new OnboardingService();

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Initial state
  currentState: 'signup',
  teamId: null,
  teamName: null,
  role: null,
  firstName: null,
  lastName: null,
  avatarEmoji: null,
  hasGitHub: false,
  isLoading: false,
  error: null,

  /**
   * Transition: signup → team_created
   * Called after user creates their team
   */
  createTeam: (teamId: string, teamName: string) => {
    const state = get();

    // Validate transition
    if (state.currentState !== 'signup' && state.currentState !== 'profile_setup') {
      console.error('❌ [OnboardingStore] Invalid transition: createTeam can only be called from signup or profile_setup state');
      return;
    }

    // Update state
    const newState: OnboardingState = 'team_created';
    set({
      currentState: newState,
      teamId,
      teamName,
    });

    // Persist to localStorage
    onboardingService.saveProgress({
      currentState: newState,
      teamId,
      teamName,
    });
  },

  /**
   * Transition: signup → profile_setup
   * Called when a magic link user is routed to the profile setup page
   */
  enterProfileSetup: () => {
    const state = get();

    if (state.currentState !== 'signup') {
      return; // Already past signup, no-op
    }

    set({ currentState: 'profile_setup' });

    onboardingService.saveProgress({
      currentState: 'profile_setup',
    });
  },

  /**
   * Transition: profile_setup → team_created (after profile is saved)
   */
  completeProfile: (firstName: string, lastName: string, avatarEmoji?: string) => {
    const state = get();

    if (state.currentState !== 'signup' && state.currentState !== 'profile_setup') {
      console.error('❌ [OnboardingStore] Invalid transition: completeProfile can only be called from signup or profile_setup state');
      return;
    }

    const newState: OnboardingState = 'team_created';
    set({
      currentState: newState,
      firstName,
      lastName,
      avatarEmoji: avatarEmoji || null,
    });

    onboardingService.saveProgress({
      currentState: newState,
      firstName,
      lastName,
      avatarEmoji,
    });
  },

  /**
   * Transition: team_created → role_selected (or github_setup if Developer)
   * Called after user selects their role
   */
  selectRole: (role: 'admin' | 'developer' | 'pm' | 'qa') => {
    const state = get();

    // Validate transition
    if (state.currentState !== 'team_created') {
      console.error('❌ [OnboardingStore] Invalid transition: selectRole can only be called from team_created state');
      return;
    }

    // Determine next state based on role
    // Developers go to github_setup, others skip to complete
    const nextState: OnboardingState = role === 'developer' ? 'github_setup' : 'complete';

    set({
      currentState: nextState,
      role,
    });

    // Persist to localStorage
    onboardingService.saveProgress({
      currentState: nextState,
      teamId: state.teamId || undefined,
      teamName: state.teamName || undefined,
      role,
    });

    // If skipping GitHub setup, complete onboarding
    if (nextState === 'complete') {
      get().completeOnboarding();
    }
  },

  /**
   * Transition: github_setup → complete
   * Called after developer sets up GitHub connection
   */
  setupGitHub: () => {
    const state = get();

    // Validate transition
    if (state.currentState !== 'github_setup') {
      console.error('❌ [OnboardingStore] Invalid transition: setupGitHub can only be called from github_setup state');
      return;
    }

    set({
      currentState: 'complete',
      hasGitHub: true,
    });

    // Persist to localStorage
    onboardingService.saveProgress({
      currentState: 'complete',
      teamId: state.teamId || undefined,
      teamName: state.teamName || undefined,
      role: state.role || undefined,
      hasGitHub: true,
      completedAt: new Date().toISOString(),
    });

    // Complete onboarding
    get().completeOnboarding();
  },

  /**
   * Mark onboarding as complete and clear localStorage
   */
  completeOnboarding: () => {
    set({
      currentState: 'complete',
    });

    // Clear localStorage after completion
    setTimeout(() => {
      onboardingService.clearProgress();
    }, 1000);
  },

  /**
   * Resume onboarding from localStorage (called on app init)
   */
  resumeFromStorage: () => {
    const progress = onboardingService.loadProgress();

    if (!progress) {
      console.log('ℹ️ [OnboardingStore] No saved progress found');
      return;
    }

    console.log('⏯️ [OnboardingStore] Resuming from saved progress:', progress.currentState);

    set({
      currentState: progress.currentState,
      teamId: progress.teamId || null,
      teamName: progress.teamName || null,
      role: progress.role || null,
      hasGitHub: progress.hasGitHub || false,
      firstName: progress.firstName || null,
      lastName: progress.lastName || null,
      avatarEmoji: progress.avatarEmoji || null,
    });
  },

  /**
   * Reset onboarding state (for testing/debugging)
   */
  reset: () => {
    set({
      currentState: 'signup',
      teamId: null,
      teamName: null,
      role: null,
      hasGitHub: false,
      isLoading: false,
      error: null,
      firstName: null,
      lastName: null,
      avatarEmoji: null,
    });

    onboardingService.clearProgress();
  },
}));
