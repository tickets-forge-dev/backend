import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

    // --- Resolve teamId ---
    // Priority 1: explicit x-team-id header (used by CLI and web client)
    const headerTeamId = request.headers['x-team-id'] as string | undefined;

    let resolvedTeamId: string | null = null;
    let workspaceId: string; // kept for backward-compat (GitHub/Jira/Linear integrations)

    if (headerTeamId) {
      resolvedTeamId = headerTeamId;
    }

    try {
      const user = await this.userRepository.getById(firebaseUser.uid);
      const currentTeamId = user?.getCurrentTeamId()?.getValue() || null;

      // Fallback Priority 2: user's current team from Firestore
      if (!resolvedTeamId) {
        resolvedTeamId = currentTeamId;
      }

      if (resolvedTeamId) {
        // Derive legacy workspaceId for integrations stored under old keys
        workspaceId = `ws_team_${resolvedTeamId.substring(5, 17)}`;
      } else {
        // No team context — personal workspace fallback
        workspaceId = `ws_${firebaseUser.uid.substring(0, 12)}`;
      }
    } catch (error) {
      console.warn('[WorkspaceGuard] Error fetching user/team:', error);
      workspaceId = `ws_${firebaseUser.uid.substring(0, 12)}`;
    }

    if (!resolvedTeamId) {
      throw new BadRequestException('No team context. Send x-team-id header or join a team.');
    }

    // Attach both to request
    request.teamId = resolvedTeamId;
    request.workspaceId = workspaceId; // backward-compat for non-ticket endpoints

    console.log(`[WorkspaceGuard] userId: ${firebaseUser.uid}, teamId: ${resolvedTeamId}, workspaceId: ${workspaceId}`);

    return true;
  }
}
