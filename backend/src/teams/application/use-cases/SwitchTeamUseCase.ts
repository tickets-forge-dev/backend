import { Injectable, ForbiddenException } from '@nestjs/common';
import { TeamId } from '../../domain/TeamId';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';

export interface SwitchTeamCommand {
  userId: string;
  teamId: string;
}

export interface SwitchTeamResult {
  currentTeamId: string;
  teamName: string;
}

/**
 * SwitchTeamUseCase
 *
 * Business logic for switching user's current team.
 * - User must be a member of target team
 */
@Injectable()
export class SwitchTeamUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  async execute(command: SwitchTeamCommand): Promise<SwitchTeamResult> {
    const teamId = TeamId.create(command.teamId);

    // Load team
    const team = await this.teamRepository.getById(teamId);
    if (!team) {
      throw new Error(`Team ${command.teamId} not found`);
    }

    // Load user
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User ${command.userId} not found`);
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
