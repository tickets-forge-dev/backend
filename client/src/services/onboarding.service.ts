/**
 * Onboarding Service
 * Handles persistence of onboarding state to localStorage
 */

export type OnboardingState = 'signup' | 'team_created' | 'role_selected' | 'github_setup' | 'complete';

export interface OnboardingProgress {
  currentState: OnboardingState;
  teamId?: string;
  teamName?: string;
  role?: 'admin' | 'developer' | 'pm' | 'qa';
  hasGitHub?: boolean;
  completedAt?: string;
}

const STORAGE_KEY = 'forge_onboarding_progress';

export class OnboardingService {
  /**
   * Save onboarding progress to localStorage
   */
  saveProgress(progress: OnboardingProgress): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('❌ [OnboardingService] Failed to save progress:', error);
    }
  }

  /**
   * Load onboarding progress from localStorage
   */
  loadProgress(): OnboardingProgress | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const progress = JSON.parse(stored) as OnboardingProgress;

      // Validate state
      const validStates: OnboardingState[] = ['signup', 'team_created', 'role_selected', 'github_setup', 'complete'];
      if (!validStates.includes(progress.currentState)) {
        console.warn('⚠️ [OnboardingService] Invalid state in storage, resetting');
        return null;
      }

      return progress;
    } catch (error) {
      console.error('❌ [OnboardingService] Failed to load progress:', error);
      return null;
    }
  }

  /**
   * Clear onboarding progress (called when onboarding completes)
   */
  clearProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('❌ [OnboardingService] Failed to clear progress:', error);
    }
  }

  /**
   * Check if user has incomplete onboarding
   */
  hasIncompleteOnboarding(): boolean {
    const progress = this.loadProgress();
    return progress !== null && progress.currentState !== 'complete';
  }
}
