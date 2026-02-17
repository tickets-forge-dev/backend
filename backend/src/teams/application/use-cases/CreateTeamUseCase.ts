import { Injectable } from '@nestjs/common';
import { TeamFactory } from '../../domain/TeamFactory';
import { TeamSettings } from '../../domain/TeamSettings';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { InvalidTeamException } from '../../domain/exceptions/InvalidTeamException';

export interface CreateTeamCommand {
  userId: string;
  teamName: string;
  allowMemberInvites?: boolean;
}

export interface CreateTeamResult {
  teamId: string;
  teamName: string;
  slug: string;
}

/**
 * CreateTeamUseCase
 *
 * Business logic for creating a new team.
 * - Creates team with user as owner
 * - Adds user to team
 * - Sets team as user's current team
 */
@Injectable()
export class CreateTeamUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  async execute(command: CreateTeamCommand): Promise<CreateTeamResult> {
    // Validate slug uniqueness
    const team = TeamFactory.createTeam(
      command.teamName,
      command.userId,
      TeamSettings.create(
        undefined,
        command.allowMemberInvites ?? true,
      ),
    );

    const isSlugUnique = await this.teamRepository.isSlugUnique(team.getSlug());
    if (!isSlugUnique) {
      throw InvalidTeamException.duplicateSlug(team.getSlug());
    }

    // Save team
    await this.teamRepository.save(team);

    // Add team to user and set as current
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User ${command.userId} not found`);
    }

    const updatedUser = user.addTeam(team.getId());
    await this.userRepository.save(updatedUser);

    return {
      teamId: team.getId().getValue(),
      teamName: team.getName(),
      slug: team.getSlug(),
    };
  }
}
