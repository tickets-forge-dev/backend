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
    // BUG FIX #1: Check user exists FIRST
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User ${command.userId} not found`);
    }

    // Create team
    const team = TeamFactory.createTeam(
      command.teamName,
      command.userId,
      TeamSettings.create(
        undefined,
        command.allowMemberInvites ?? true,
      ),
    );

    // Validate slug uniqueness
    const isSlugUnique = await this.teamRepository.isSlugUnique(team.getSlug());
    if (!isSlugUnique) {
      throw InvalidTeamException.duplicateSlug(team.getSlug());
    }

    // Save team
    await this.teamRepository.save(team);

    // BUG FIX #3: Add team to user and explicitly switch to it
    // addTeam() only sets as current if user has no teams, so we need switchTeam() for existing teams
    let updatedUser = user.addTeam(team.getId());
    if (user.getCurrentTeamId()) {
      // User already had a team, explicitly switch to new one
      updatedUser = updatedUser.switchTeam(team.getId());
    }
    await this.userRepository.save(updatedUser);

    // BUG FIX #2: Return complete team data for frontend
    return {
      id: team.getId().getValue(),
      name: team.getName(),
      slug: team.getSlug(),
      ownerId: team.getOwnerId(),
      settings: {
        defaultWorkspaceId: team.getSettings().defaultWorkspaceId,
        allowMemberInvites: team.getSettings().allowMemberInvites,
      },
      isOwner: true, // Creator is always owner
      createdAt: team.getCreatedAt().toISOString(),
      updatedAt: team.getUpdatedAt().toISOString(),
    };
  }
}
