/**
 * TeamId - Value Object
 *
 * Represents a unique identifier for a Team.
 * Ensures type safety and prevents string mixups.
 */
export class TeamId {
  private readonly value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TeamId cannot be empty');
    }
    this.value = value;
  }

  static create(value: string): TeamId {
    return new TeamId(value);
  }

  static generate(): TeamId {
    const randomId = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    return new TeamId(`team_${randomId}`);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TeamId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
