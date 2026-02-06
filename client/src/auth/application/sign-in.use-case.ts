import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import { AuthService } from '@/services/auth.service';

export class SignInUseCase {
  constructor(private authService: AuthService) {}

  async signInWithGoogle(): Promise<void> {
    console.log('🔐 [SignInUseCase] Starting Google sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('🔐 [SignInUseCase] Popup sign-in successful');
    await this.authService.initializeWorkspace();
  }

  async signInWithGitHub(): Promise<void> {
    console.log('🔐 [SignInUseCase] Starting GitHub sign-in...');
    const result = await signInWithPopup(auth, githubProvider);
    console.log('🔐 [SignInUseCase] Popup sign-in successful');
    await this.authService.initializeWorkspace();
  }

}
