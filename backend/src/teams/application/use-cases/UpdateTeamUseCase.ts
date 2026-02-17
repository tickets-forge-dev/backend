import { Injectable, ForbiddenException } from '@nestjs/common';
import { TeamId } from '../../domain/TeamId';
import { TeamSettings } from '../../domain/TeamSettings';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
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
  teamId: string;
  teamName: string;
  slug: string;
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
  ) {}

  async execute(command: UpdateTeamCommand): Promise<UpdateTeamResult> {
    const teamId = TeamId.create(command.teamId);

    // Load team
    const team = await this.teamRepository.getById(teamId);
    if (!team) {
      throw new Error(`Team ${command.teamId} not found`);
    }

    // Verify ownership
    if (!team.isOwnedBy(command.userId)) {
      throw new ForbiddenException('Only team owner can update team');
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

    return {
      teamId: updatedTeam.getId().getValue(),
      teamName: updatedTeam.getName(),
      slug: updatedTeam.getSlug(),
    };
  }
}
