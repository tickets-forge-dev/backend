/**
 * InvalidTeamException
 *
 * Thrown when Team validation fails.
 */
export class InvalidTeamException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTeamException';
  }

  static invalidName(name: string): InvalidTeamException {
    return new InvalidTeamException(
      `Team name must be between 3 and 50 characters. Received: "${name}" (${name.length} chars)`,
    );
  }

  static duplicateSlug(slug: string): InvalidTeamException {
    return new InvalidTeamException(
      `Team slug "${slug}" is already taken. Cannot create duplicate slug.`,
    );
  }

  static missingOwnerId(): InvalidTeamException {
    return new InvalidTeamException('Team must have an ownerId (Firebase UID)');
  }

  static invalidOwnerId(ownerId: string): InvalidTeamException {
    return new InvalidTeamException(
      `Invalid ownerId format: "${ownerId}". Must be a non-empty string.`,
    );
  }
}
