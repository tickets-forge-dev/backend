import { create } from 'zustand';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile, ProfileValidationErrors } from '@/src/types/user';
import { UserApiService } from '@/src/api/user-api';
import { useAuthStore } from '@/stores/auth.store';
import { validateProfileForm, hasValidationErrors } from '@/src/utils/validation';

interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  errors: ProfileValidationErrors;
  serverError: string | null;

  // Actions
  loadProfile: (userApi: UserApiService) => Promise<void>;
  updateProfile: (userApi: UserApiService, data: UserProfile) => Promise<boolean>;
  validateFields: (data: UserProfile) => ProfileValidationErrors;
  clearErrors: () => void;
}

export const useUserStore = create<UserProfileState>((set) => ({
  profile: null,
  isLoading: false,
  isSaving: false,
  errors: {},
  serverError: null,

  loadProfile: async (userApi: UserApiService) => {
    set({ isLoading: true, serverError: null });
    try {
      const profile = await userApi.getProfile();
      set({ profile, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      set({ serverError: message, isLoading: false });
    }
  },

  updateProfile: async (userApi: UserApiService, data: UserProfile) => {
    const errors = validateProfileForm(data);
    if (hasValidationErrors(errors)) {
      set({ errors });
      return false;
    }

    set({ isSaving: true, errors: {}, serverError: null });

    try {
      const updated = await userApi.updateProfile({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      });
      set({ profile: updated, isSaving: false });

      // Sync display name to Firebase Auth so sidebar updates immediately
      const displayName = `${updated.firstName} ${updated.lastName}`.trim();
      const firebaseUser = auth?.currentUser;
      if (firebaseUser) {
        await firebaseUpdateProfile(firebaseUser, { displayName });
        // Re-set the user in auth store to trigger re-render
        useAuthStore.getState().setUser({ ...firebaseUser, displayName } as any);
      }

      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      const message = axiosError.response?.data?.message;
      set({
        serverError: message || 'Failed to update profile',
        isSaving: false,
      });
      return false;
    }
  },

  validateFields: (data: UserProfile) => {
    const errors = validateProfileForm(data);
    set({ errors });
    return errors;
  },

  clearErrors: () => {
    set({ errors: {}, serverError: null });
  },
}));
