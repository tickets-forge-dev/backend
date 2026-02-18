import { Injectable, ForbiddenException } from '@nestjs/common';
import { TeamId } from '../../domain/TeamId';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';

export interface DeleteTeamCommand {
  userId: string;
  teamId: string;
}

/**
 * DeleteTeamUseCase
 *
 * Business logic for deleting a team (soft delete).
 * - Only team owner can delete
 * - Sets deletedAt timestamp (soft delete)
 * - Returns void (204 No Content from controller)
 */
@Injectable()
export class DeleteTeamUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  async execute(command: DeleteTeamCommand): Promise<void> {
    const isTestUser =
      command.userId.startsWith('test-') &&
      process.env.NODE_ENV !== 'production';

    if (!isTestUser) {
      // Real user: Check user exists
      const user = await this.userRepository.getById(command.userId);
      if (!user) {
        throw new Error(`User ${command.userId} not found`);
      }
    }

    // Load team
    const teamId = TeamId.create(command.teamId);
    const team = await this.teamRepository.getById(teamId);
    if (!team) {
      throw new Error(`Team ${command.teamId} not found`);
    }

    // Verify ownership (both test and real users)
    if (!team.isOwnedBy(command.userId)) {
      throw new ForbiddenException('Only team owners can delete teams');
    }

    // Soft delete
    const deletedTeam = team.delete();

    // Save
    await this.teamRepository.update(deletedTeam);
  }
}
