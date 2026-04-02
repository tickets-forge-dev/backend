import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { FirestoreTeamRepository } from '../../../teams/infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreTeamMemberRepository } from '../../../teams/infrastructure/persistence/FirestoreTeamMemberRepository';
import { TeamId } from '../../../teams/domain/TeamId';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly userRepository: FirestoreUserRepository,
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly teamMemberRepository: FirestoreTeamMemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const firebaseUser = request.user; // Set by FirebaseAuthGuard

    if (!firebaseUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Session JWT (sandbox MCP) — teamId is already in the token, skip user lookups
    if (firebaseUser.isSessionToken) {
      request.teamId = firebaseUser.teamId;
      request.workspaceId = `ws_team_${firebaseUser.teamId.substring(5, 17)}`;
      return true;
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

      // Verify user is an active member of the resolved team
      if (resolvedTeamId && !resolvedTeamId.startsWith('personal_')) {
        const team = await this.teamRepository.getById(TeamId.create(resolvedTeamId));
        if (!team) {
          throw new ForbiddenException('Team not found');
        }

        // Team owner always has access
        const isOwner = team.isOwnedBy(firebaseUser.uid);
        if (!isOwner) {
          const member = await this.teamMemberRepository.findByUserAndTeam(
            firebaseUser.uid,
            resolvedTeamId,
          );
          if (!member || !member.isActive()) {
            throw new ForbiddenException('You are not a member of this team');
          }
        }
      }

      if (resolvedTeamId) {
        // Derive legacy workspaceId for integrations stored under old keys
        workspaceId = `ws_team_${resolvedTeamId.substring(5, 17)}`;
      } else {
        // No team context — personal workspace fallback
        workspaceId = `ws_${firebaseUser.uid.substring(0, 12)}`;
      }
    } catch (error) {
      // Re-throw auth/permission errors
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.warn('[WorkspaceGuard] Error fetching user/team:', error);
      workspaceId = `ws_${firebaseUser.uid.substring(0, 12)}`;
    }

    if (!resolvedTeamId) {
      // Personal workspace: scope data to the authenticated user
      resolvedTeamId = `personal_${firebaseUser.uid}`;
    }

    // Attach both to request
    request.teamId = resolvedTeamId;
    request.workspaceId = workspaceId; // backward-compat for non-ticket endpoints

    return true;
  }
}
