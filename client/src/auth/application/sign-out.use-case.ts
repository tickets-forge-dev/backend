import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export class SignOutUseCase {
  async execute(): Promise<void> {
    localStorage.removeItem('github_access_token');
    await firebaseSignOut(auth);
  }
}
