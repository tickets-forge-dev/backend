import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { FirestoreTeamRepository } from '../../../teams/infrastructure/persistence/FirestoreTeamRepository';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly userRepository: FirestoreUserRepository,
    private readonly teamRepository: FirestoreTeamRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const firebaseUser = request.user; // Set by FirebaseAuthGuard

    if (!firebaseUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    let workspaceId: string;

    try {
      // Get user document from Firestore to check current team
      const user = await this.userRepository.getById(firebaseUser.uid);

      if (user && user.getCurrentTeamId()) {
        // User has a current team - use team's workspace
        const teamId = user.getCurrentTeamId();
        const team = await this.teamRepository.getById(teamId!);

        if (team && team.getSettings().defaultWorkspaceId) {
          // Team has a configured workspace - use it
          workspaceId = team.getSettings().defaultWorkspaceId!;
        } else {
          // Team exists but no workspace set - use team owner's workspace
          workspaceId = `ws_${team.getOwnerId().substring(0, 12)}`;
        }
      } else {
        // No current team - use personal workspace
        workspaceId = `ws_${firebaseUser.uid.substring(0, 12)}`;
      }
    } catch (error) {
      // Fallback to personal workspace on error
      console.warn('[WorkspaceGuard] Error fetching user/team, using personal workspace:', error);
      workspaceId = `ws_${firebaseUser.uid.substring(0, 12)}`;
    }

    // Attach workspaceId to request for controllers
    request.workspaceId = workspaceId;

    return true;
  }
}
