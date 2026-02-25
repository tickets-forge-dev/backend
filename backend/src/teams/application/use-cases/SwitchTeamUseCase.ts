import { Injectable, ForbiddenException } from '@nestjs/common';
import { TeamId } from '../../domain/TeamId';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';

export interface SwitchTeamCommand {
  userId: string;
  teamId: string | null;
}

export interface SwitchTeamResult {
  currentTeamId: string | null;
  teamName: string | null;
}

/**
 * SwitchTeamUseCase
 *
 * Business logic for switching user's current team.
 * - Pass teamId to switch to a team (user must be a member)
 * - Pass null to switch to personal workspace
 */
@Injectable()
export class SwitchTeamUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  async execute(command: SwitchTeamCommand): Promise<SwitchTeamResult> {
    // Check user exists FIRST
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User ${command.userId} not found`);
    }

    // Switch to personal workspace if teamId is null
    if (!command.teamId) {
      const updatedUser = user.switchTeam(null);
      await this.userRepository.save(updatedUser);
      return {
        currentTeamId: null,
        teamName: null,
      };
    }

    // Load team
    const teamId = TeamId.create(command.teamId);
    const team = await this.teamRepository.getById(teamId);
    if (!team) {
      throw new Error(`Team ${command.teamId} not found`);
    }

    // Verify user is member
    if (!user.isMemberOfTeam(teamId)) {
      throw new ForbiddenException('You are not a member of this team');
    }

    // Switch team
    const updatedUser = user.switchTeam(teamId);
    await this.userRepository.save(updatedUser);

    return {
      currentTeamId: updatedUser.getCurrentTeamId()!.getValue(),
      teamName: team.getName(),
    };
  }
}
