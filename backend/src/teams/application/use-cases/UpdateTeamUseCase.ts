import { Injectable, ForbiddenException } from '@nestjs/common';
import { TeamId } from '../../domain/TeamId';
import { TeamSettings } from '../../domain/TeamSettings';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { InvalidTeamException } from '../../domain/exceptions/InvalidTeamException';

export interface UpdateTeamCommand {
  userId: string;
  teamId: string;
  teamName?: string;
  settings?: {
    defaultWorkspaceId?: string;
    allowMemberInvites?: boolean;
  };
}

export interface UpdateTeamResult {
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
 * UpdateTeamUseCase
 *
 * Business logic for updating a team.
 * - Only team owner can update
 * - Validates slug uniqueness if name changes
 */
@Injectable()
export class UpdateTeamUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  async execute(command: UpdateTeamCommand): Promise<UpdateTeamResult> {
    // BUG FIX #1: Check user exists FIRST
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User ${command.userId} not found`);
    }

    // Load team
    const teamId = TeamId.create(command.teamId);
    const team = await this.teamRepository.getById(teamId);
    if (!team) {
      throw new Error(`Team ${command.teamId} not found`);
    }

    // BUG FIX #2: Verify ownership (consistent error message)
    if (!team.isOwnedBy(command.userId)) {
      throw new ForbiddenException('Only team owners can update team settings');
    }

    // Update name if provided
    let updatedTeam = team;
    if (command.teamName && command.teamName !== team.getName()) {
      updatedTeam = updatedTeam.updateName(command.teamName);

      // Check slug uniqueness (excluding current team)
      const isSlugUnique = await this.teamRepository.isSlugUnique(
        updatedTeam.getSlug(),
        team.getId().getValue(),
      );
      if (!isSlugUnique) {
        throw InvalidTeamException.duplicateSlug(updatedTeam.getSlug());
      }
    }

    // Update settings if provided
    if (command.settings) {
      const currentSettings = updatedTeam.getSettings();
      const newSettings = TeamSettings.create(
        command.settings.defaultWorkspaceId ?? currentSettings.defaultWorkspaceId,
        command.settings.allowMemberInvites ?? currentSettings.allowMemberInvites,
      );
      updatedTeam = updatedTeam.updateSettings(newSettings);
    }

    // Save
    await this.teamRepository.update(updatedTeam);

    // BUG FIX #3: Return complete team data like CreateTeamResult
    return {
      id: updatedTeam.getId().getValue(),
      name: updatedTeam.getName(),
      slug: updatedTeam.getSlug(),
      ownerId: updatedTeam.getOwnerId(),
      settings: {
        defaultWorkspaceId: updatedTeam.getSettings().defaultWorkspaceId,
        allowMemberInvites: updatedTeam.getSettings().allowMemberInvites,
      },
      isOwner: true, // Caller is always owner (verified above)
      createdAt: updatedTeam.getCreatedAt().toISOString(),
      updatedAt: updatedTeam.getUpdatedAt().toISOString(),
    };
  }
}
