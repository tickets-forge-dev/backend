import {
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export class AuthService {
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      return null;
    }
  }

  async initializeWorkspace(): Promise<void> {
    const token = await this.getIdToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
      }

      const response = await fetch(`${apiUrl}/auth/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize workspace');
      }

      // Force token refresh to get custom claims
      await auth.currentUser?.getIdToken(true);
    } catch (error: any) {
      throw error;
    }
  }
}
