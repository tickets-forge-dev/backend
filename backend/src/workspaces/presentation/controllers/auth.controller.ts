import { Controller, Post, UseGuards, Request, Inject } from '@nestjs/common';
import { CreateWorkspaceUseCase } from '../../application/use-cases/CreateWorkspaceUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { User } from '../../../users/domain/User';
import { GetUserTeamsUseCase } from '../../../teams/application/use-cases/GetUserTeamsUseCase';
import { ORGANIZATION_REPOSITORY, OrganizationRepository } from '../../../organizations/application/ports/OrganizationRepository';
import { Organization } from '../../../organizations/domain/Organization';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
    private readonly userRepository: FirestoreUserRepository,
    private readonly getUserTeamsUseCase: GetUserTeamsUseCase,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Initialize user on first login
   * Called by frontend after successful OAuth
   *
   * NOTE: This endpoint does NOT auto-create teams anymore.
   * New users will be redirected to onboarding to create their first team.
   */
  @Post('init')
  @UseGuards(FirebaseAuthGuard)
  async initializeUser(@Request() req: any) {
    const firebaseUser = req.user; // Decoded Firebase token

    // 1. Create or get user document
    let user = await this.userRepository.getById(firebaseUser.uid);

    if (!user) {
      // Create personal organization for new user
      const displayName = firebaseUser.name || firebaseUser.email?.split('@')[0] || 'User';
      const personalOrg = Organization.createPersonal(firebaseUser.uid, displayName);
      await this.organizationRepository.save(personalOrg);

      // Create new user document with org link
      user = User.create(
        firebaseUser.uid,
        firebaseUser.email || 'unknown@example.com',
        displayName,
      ).setOrganizationId(personalOrg.getId().getValue());
      await this.userRepository.save(user);
      console.log(`✅ Created user + personal org for ${firebaseUser.uid}`);
    }

    // 2. Check if user has any teams
    const teamsResult = await this.getUserTeamsUseCase.execute({
      userId: firebaseUser.uid,
    });

    const hasTeams = teamsResult.teams.length > 0;

    return {
      userId: firebaseUser.uid,
      email: firebaseUser.email || 'unknown@example.com',
      displayName: firebaseUser.name || firebaseUser.email?.split('@')[0] || 'User',
      hasTeams,
      teamCount: teamsResult.teams.length,
      currentTeamId: teamsResult.currentTeamId,
    };
  }
}
