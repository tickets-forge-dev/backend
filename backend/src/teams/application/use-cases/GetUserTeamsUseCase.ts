import { Injectable } from '@nestjs/common';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';

export interface GetUserTeamsCommand {
  userId: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
  isCurrent: boolean;
}

export interface GetUserTeamsResult {
  teams: TeamSummary[];
  currentTeamId: string | null;
}

/**
 * GetUserTeamsUseCase
 *
 * Business logic for retrieving all teams for a user.
 */
@Injectable()
export class GetUserTeamsUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  async execute(command: GetUserTeamsCommand): Promise<GetUserTeamsResult> {
    // Load user
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User ${command.userId} not found`);
    }

    // Load all teams
    const teamIds = user.getTeams();
    const teams = await Promise.all(
      teamIds.map((teamId) => this.teamRepository.getById(teamId)),
    );

    const currentTeamId = user.getCurrentTeamId();

    return {
      teams: teams
        .filter((team) => team !== null)
        .map((team) => ({
          id: team!.getId().getValue(),
          name: team!.getName(),
          slug: team!.getSlug(),
          isOwner: team!.isOwnedBy(command.userId),
          isCurrent: currentTeamId
            ? team!.getId().equals(currentTeamId)
            : false,
        })),
      currentTeamId: currentTeamId?.getValue() || null,
    };
  }
}
