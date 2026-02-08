/**
 * GitHubRepository Value Object
 *
 * Represents metadata about a GitHub repository.
 * Immutable value object - no setters, only getters.
 *
 * Part of: Story 4.1 - GitHub App Integration
 * Layer: Domain (no external dependencies)
 */

export interface GitHubRepositoryProps {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  url: string;
}

export class GitHubRepository {
  private readonly props: GitHubRepositoryProps;

  private constructor(props: GitHubRepositoryProps) {
    this.props = Object.freeze(props);
  }

  static create(props: GitHubRepositoryProps): GitHubRepository {
    this.validate(props);
    return new GitHubRepository(props);
  }

  private static validate(props: GitHubRepositoryProps): void {
    if (!props.id || props.id <= 0) {
      throw new Error('Repository ID must be a positive number');
    }

    if (!props.fullName || props.fullName.trim() === '') {
      throw new Error('Repository full name is required');
    }

    if (!props.name || props.name.trim() === '') {
      throw new Error('Repository name is required');
    }

    if (!props.owner || props.owner.trim() === '') {
      throw new Error('Repository owner is required');
    }

    if (!props.defaultBranch || props.defaultBranch.trim() === '') {
      throw new Error('Default branch is required');
    }

    if (!props.url || !this.isValidUrl(props.url)) {
      throw new Error('Valid repository URL is required');
    }

    // Validate fullName format (should be "owner/name")
    const parts = props.fullName.split('/');
    if (parts.length !== 2 || parts[0] !== props.owner || parts[1] !== props.name) {
      throw new Error('Full name must be in format "owner/name"');
    }
  }

  private static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname === 'github.com';
    } catch {
      return false;
    }
  }

  // Getters
  get id(): number {
    return this.props.id;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get name(): string {
    return this.props.name;
  }

  get owner(): string {
    return this.props.owner;
  }

  get isPrivate(): boolean {
    return this.props.private;
  }

  get defaultBranch(): string {
    return this.props.defaultBranch;
  }

  get url(): string {
    return this.props.url;
  }

  // Equality check
  equals(other: GitHubRepository): boolean {
    return this.id === other.id && this.fullName === other.fullName;
  }

  // Serialization
  toObject(): GitHubRepositoryProps {
    return { ...this.props };
  }

  toJSON(): GitHubRepositoryProps {
    return this.toObject();
  }
}
