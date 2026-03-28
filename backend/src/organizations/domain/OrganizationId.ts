/**
 * OrganizationId - Value Object
 *
 * Represents a unique identifier for an Organization.
 * Ensures type safety and prevents string mixups.
 */
export class OrganizationId {
  private readonly value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('OrganizationId cannot be empty');
    }
    this.value = value;
  }

  static create(value: string): OrganizationId {
    return new OrganizationId(value);
  }

  static generate(): OrganizationId {
    const randomId = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    return new OrganizationId(`org_${randomId}`);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
