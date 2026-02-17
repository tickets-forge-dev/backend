import { Team } from './Team';
import { TeamId } from './TeamId';
import { TeamSettings } from './TeamSettings';

/**
 * TeamFactory
 *
 * Factory for creating Team instances.
 * Centralizes team creation logic and validation.
 */
export class TeamFactory {
  /**
   * Create a new team from user input
   */
  static createTeam(
    name: string,
    ownerId: string,
    settings: TeamSettings = TeamSettings.default(),
  ): Team {
    return Team.create(name, ownerId, settings);
  }

  /**
   * Reconstitute a team from persistence layer
   * Used when loading from database
   */
  static fromPersistence(data: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    settings: {
      defaultWorkspaceId?: string;
      allowMemberInvites: boolean;
    };
    createdAt: Date | string;
    updatedAt: Date | string;
  }): Team {
    const teamId = TeamId.create(data.id);
    const settings = TeamSettings.create(
      data.settings.defaultWorkspaceId,
      data.settings.allowMemberInvites,
    );

    const createdAt =
      data.createdAt instanceof Date
        ? data.createdAt
        : new Date(data.createdAt);
    const updatedAt =
      data.updatedAt instanceof Date
        ? data.updatedAt
        : new Date(data.updatedAt);

    return Team.reconstitute(
      teamId,
      data.name,
      data.slug,
      data.ownerId,
      settings,
      createdAt,
      updatedAt,
    );
  }
}
