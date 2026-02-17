import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { CreateWorkspaceUseCase } from '../../application/use-cases/CreateWorkspaceUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { User } from '../../../users/domain/User';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  /**
   * Initialize user workspace on first login
   * Called by frontend after successful OAuth
   */
  @Post('init')
  @UseGuards(FirebaseAuthGuard)
  async initializeUser(@Request() req: any) {
    const firebaseUser = req.user; // Decoded Firebase token

    // 1. Create or get user document
    let user = await this.userRepository.getById(firebaseUser.uid);

    if (!user) {
      // Create new user document
      user = User.create(
        firebaseUser.uid,
        firebaseUser.email || 'unknown@example.com',
        firebaseUser.name || firebaseUser.email?.split('@')[0] || 'User',
      );
      await this.userRepository.save(user);
      console.log(`✅ Created user document for ${firebaseUser.uid}`);
    }

    // 2. Create or get workspace
    const workspace = await this.createWorkspaceUseCase.execute({
      ownerId: firebaseUser.uid,
      ownerEmail: firebaseUser.email || 'unknown@example.com',
    });

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      isNewWorkspace: true, // Could check if just created vs already existed
    };
  }
}
