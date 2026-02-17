import { Injectable, ForbiddenException } from '@nestjs/common';
import { TeamId } from '../../domain/TeamId';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';

export interface GetTeamCommand {
  userId: string;
  teamId: string;
}

export interface GetTeamResult {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  settings: {
    defaultWorkspaceId?: string;
    allowMemberInvites: boolean;
  };
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * GetTeamUseCase
 *
 * Business logic for retrieving a team.
 * - User must be a member or owner
 */
@Injectable()
export class GetTeamUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  async execute(command: GetTeamCommand): Promise<GetTeamResult> {
    const teamId = TeamId.create(command.teamId);

    // Load team
    const team = await this.teamRepository.getById(teamId);
    if (!team) {
      throw new Error(`Team ${command.teamId} not found`);
    }

    // Verify user is member
    const user = await this.userRepository.getById(command.userId);
    if (!user || !user.isMemberOfTeam(teamId)) {
      throw new ForbiddenException('You are not a member of this team');
    }

    return {
      id: team.getId().getValue(),
      name: team.getName(),
      slug: team.getSlug(),
      ownerId: team.getOwnerId(),
      settings: team.getSettings().toObject(),
      isOwner: team.isOwnedBy(command.userId),
      createdAt: team.getCreatedAt().toISOString(),
      updatedAt: team.getUpdatedAt().toISOString(),
    };
  }
}
