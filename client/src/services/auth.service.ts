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

  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }

  async initializeWorkspace(): Promise<void> {
    const token = await this.getIdToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize workspace');
      }

      const data = await response.json();
      console.log('✅ Workspace initialized:', data.workspaceId);

      // Force token refresh to get custom claims
      await auth.currentUser?.getIdToken(true);
    } catch (error: any) {
      console.error('Workspace initialization failed:', error);
      throw error;
    }
  }
}
