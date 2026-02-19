import { Injectable } from '@nestjs/common';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { SyncUserTeamsUseCase } from './SyncUserTeamsUseCase';

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
    private readonly syncUserTeamsUseCase: SyncUserTeamsUseCase,
  ) {}

  async execute(command: GetUserTeamsCommand): Promise<GetUserTeamsResult> {
    // Load user (create if doesn't exist - handles race condition with auth/init)
    let user = await this.userRepository.getById(command.userId);
    if (!user) {
      console.warn(
        `[GetUserTeamsUseCase] User ${command.userId} not found - returning empty teams array. ` +
        `User document may not be created yet.`
      );
      // Return empty teams for new users (race condition with auth/init)
      return {
        teams: [],
        currentTeamId: null,
      };
    }

    // Self-healing: If user has empty teamIds but owns teams, auto-sync
    const teamIds = user.getTeams();
    if (teamIds.length === 0) {
      // Check if user actually owns any teams
      const ownedTeams = await this.teamRepository.getByOwnerId(command.userId);
      const activeOwnedTeams = ownedTeams.filter((team) => !team.isDeleted());

      if (activeOwnedTeams.length > 0) {
        // Data corruption detected - auto-sync
        console.warn(
          `[GetUserTeamsUseCase] Data corruption detected for user ${command.userId}: ` +
          `owns ${activeOwnedTeams.length} teams but teamIds array is empty. Auto-syncing...`
        );

        await this.syncUserTeamsUseCase.execute({ userId: command.userId });

        // Reload user with corrected teamIds
        user = (await this.userRepository.getById(command.userId))!;
      }
    }

    // Load all teams
    const updatedTeamIds = user.getTeams();
    const teams = await Promise.all(
      updatedTeamIds.map((teamId) => this.teamRepository.getById(teamId)),
    );

    const currentTeamId = user.getCurrentTeamId();

    return {
      teams: teams
        .filter((team) => team !== null && !team.isDeleted())
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
