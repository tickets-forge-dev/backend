import {
  signInWithPopup,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';

export class AuthService {
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      // Handle specific OAuth errors
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  async signInWithGitHub(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      return result.user;
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error.message || 'Failed to sign in with GitHub');
    }
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}
