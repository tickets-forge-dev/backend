import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { CreateWorkspaceUseCase } from '../../application/use-cases/CreateWorkspaceUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';

@Controller('auth')
export class AuthController {
  constructor(private readonly createWorkspaceUseCase: CreateWorkspaceUseCase) {}

  /**
   * Initialize user workspace on first login
   * Called by frontend after successful OAuth
   */
  @Post('init')
  @UseGuards(FirebaseAuthGuard)
  async initializeUser(@Request() req: any) {
    const user = req.user; // Decoded Firebase token

    const workspace = await this.createWorkspaceUseCase.execute({
      ownerId: user.uid,
      ownerEmail: user.email || 'unknown@example.com',
    });

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      isNewWorkspace: true, // Could check if just created vs already existed
    };
  }
}
