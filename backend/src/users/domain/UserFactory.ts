import { User } from './User';
import { TeamId } from '../../teams/domain/TeamId';

/**
 * UserFactory
 *
 * Factory for creating User instances.
 */
export class UserFactory {
  /**
   * Create a new user from Firebase Auth data
   */
  static createUser(
    userId: string,
    email: string,
    displayName: string,
    photoURL?: string,
  ): User {
    return User.create(userId, email, displayName, photoURL);
  }

  /**
   * Reconstitute a user from persistence layer
   */
  static fromPersistence(data: {
    userId: string;
    email: string;
    displayName: string;
    photoURL?: string;
    currentTeamId: string | null;
    teams: string[];
    createdAt: Date | string;
    updatedAt: Date | string;
  }): User {
    const currentTeamId = data.currentTeamId
      ? TeamId.create(data.currentTeamId)
      : null;
    const teams = data.teams.map((id) => TeamId.create(id));

    const createdAt =
      data.createdAt instanceof Date
        ? data.createdAt
        : new Date(data.createdAt);
    const updatedAt =
      data.updatedAt instanceof Date
        ? data.updatedAt
        : new Date(data.updatedAt);

    return User.reconstitute(
      data.userId,
      data.email,
      data.displayName,
      data.photoURL,
      currentTeamId,
      teams,
      createdAt,
      updatedAt,
    );
  }
}
