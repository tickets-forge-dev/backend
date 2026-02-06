import {
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export class AuthService {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
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
