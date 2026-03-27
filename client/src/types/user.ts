/**
 * User profile types for profile management.
 * Note: Only firstName, lastName, and avatar are editable.
 * Updating these fields does NOT affect team membership, roles, or permissions.
 */

export interface UserProfile {
  firstName: string;
  lastName: string;
  photoURL?: string;
  avatarEmoji?: string | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  user: UserProfile;
}

export interface AvatarResponse {
  success: boolean;
  user: { photoURL?: string; avatarEmoji?: string | null };
}

export interface ProfileValidationErrors {
  firstName?: string;
  lastName?: string;
}
