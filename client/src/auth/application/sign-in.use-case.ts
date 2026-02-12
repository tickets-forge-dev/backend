import {
  signInWithPopup,
  linkWithCredential,
  GoogleAuthProvider,
  GithubAuthProvider,
  AuthCredential
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import { AuthService } from '@/services/auth.service';
import { FirebaseError } from 'firebase/app';

export class SignInUseCase {
  constructor(private authService: AuthService) {}

  async signInWithGoogle(): Promise<void> {
    try {
      await signInWithPopup(auth, googleProvider);
      await this.authService.initializeWorkspace();
    } catch (error) {
      await this.handleSignInError(error, 'Google', googleProvider);
    }
  }

  async signInWithGitHub(): Promise<void> {
    try {
      const result = await signInWithPopup(auth, githubProvider);

      // Store GitHub access token for fetching user's repositories
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (accessToken) {
        localStorage.setItem('github_access_token', accessToken);
      }

      await this.authService.initializeWorkspace();
    } catch (error) {
      await this.handleSignInError(error, 'GitHub', githubProvider);
    }
  }

  private async handleSignInError(error: unknown, provider: string, authProvider: GoogleAuthProvider | GithubAuthProvider): Promise<void> {
    if (error instanceof FirebaseError) {
      // Handle account linking error
      if (error.code === 'auth/account-exists-with-different-credential') {
        const pendingCredential = error.customData?.credential as AuthCredential | undefined;
        const email = error.customData?.email;

        if (pendingCredential && email && auth.currentUser) {
          try {
            // Link the pending credential to the existing account
            await linkWithCredential(auth.currentUser, pendingCredential);
            await this.authService.initializeWorkspace();
            return;
          } catch (linkError) {
            console.error('Failed to link accounts:', linkError);
            throw new Error(`Failed to link ${provider} account. Please try again.`);
          }
        }

        const otherProvider = this.getOtherProvider(provider);
        throw new Error(
          `This email is already linked to ${otherProvider}. Please sign in with ${otherProvider} first, then connect ${provider}.`
        );
      }

      throw error;
    }
    throw error;
  }

  private getOtherProvider(current: string): string {
    return current === 'Google' ? 'GitHub' : 'Google';
  }
}
