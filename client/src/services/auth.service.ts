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

  async initializeWorkspace(): Promise<{ hasTeams: boolean; teamCount: number; currentTeamId: string | null }> {
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
        throw new Error('Failed to initialize user');
      }

      const data = await response.json();

      // Force token refresh to get custom claims
      await auth.currentUser?.getIdToken(true);

      return {
        hasTeams: data.hasTeams || false,
        teamCount: data.teamCount || 0,
        currentTeamId: data.currentTeamId || null,
      };
    } catch (error: any) {
      throw error;
    }
  }
}
