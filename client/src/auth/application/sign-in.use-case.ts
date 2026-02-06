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

  async handleRedirectResult(): Promise<boolean> {
    console.log('🔐 [SignInUseCase] Checking for redirect result...');
    console.log('🔐 [SignInUseCase] Current auth state before getRedirectResult:', {
      currentUser: auth.currentUser?.email || 'none',
      uid: auth.currentUser?.uid || 'none'
    });
    
    try {
      const result = await getRedirectResult(auth);
      
      console.log('🔐 [SignInUseCase] getRedirectResult returned:', {
        hasResult: !!result,
        hasUser: !!result?.user,
        userEmail: result?.user?.email || 'none',
        providerId: result?.providerId || 'none'
      });
      
      if (result?.user) {
        console.log('✅ [SignInUseCase] OAuth redirect successful:', {
          email: result.user.email,
          uid: result.user.uid
        });
        
        console.log('🔐 [SignInUseCase] Initializing workspace...');
        await this.authService.initializeWorkspace();
        console.log('✅ [SignInUseCase] Workspace initialized successfully');
        
        return true;
      }
      
      console.log('ℹ️ [SignInUseCase] No redirect result found');
      return false;
    } catch (error: any) {
      console.error('❌ [SignInUseCase] Redirect result error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }
}
