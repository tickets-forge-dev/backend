/**
 * Repository Context Value Object
 *
 * Represents the repository and branch context for an AEC.
 * This enables:
 * - Snapshot locking (commit SHA)
 * - Drift detection (compare current vs original)
 * - Branch-aware code analysis
 *
 * Domain Layer - No framework dependencies
 */

export interface RepositoryContextProps {
  repositoryFullName: string; // "owner/repo"
  branchName: string; // "main", "develop", etc.
  commitSha: string; // HEAD commit at generation time
  isDefaultBranch: boolean; // true if this is the repo's default branch
  selectedAt: Date; // When the branch was selected
}

export class RepositoryContext {
  private constructor(
    public readonly repositoryFullName: string,
    public readonly branchName: string,
    public readonly commitSha: string,
    public readonly isDefaultBranch: boolean,
    public readonly selectedAt: Date,
  ) {
    this.validate();
  }

  static create(props: RepositoryContextProps): RepositoryContext {
    return new RepositoryContext(
      props.repositoryFullName,
      props.branchName,
      props.commitSha,
      props.isDefaultBranch,
      props.selectedAt,
    );
  }

  private validate(): void {
    // Validate repository full name format (owner/repo)
    const repoRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
    if (!repoRegex.test(this.repositoryFullName)) {
      throw new Error(
        `Invalid repository format: ${this.repositoryFullName}. Must be "owner/repo"`,
      );
    }

    // Validate branch name (no spaces, no special chars except / - _)
    const branchRegex = /^[a-zA-Z0-9/_-]+$/;
    if (!branchRegex.test(this.branchName)) {
      throw new Error(
        `Invalid branch name: ${this.branchName}. Must contain only alphanumeric, /, -, _`,
      );
    }

    // Validate commit SHA (40 character hex string)
    const shaRegex = /^[a-f0-9]{40}$/;
    if (!shaRegex.test(this.commitSha)) {
      throw new Error(`Invalid commit SHA: ${this.commitSha}. Must be 40 character hex string`);
    }

    // Validate date
    if (!(this.selectedAt instanceof Date) || isNaN(this.selectedAt.getTime())) {
      throw new Error('Invalid selectedAt date');
    }
  }

  // Extract owner and repo separately
  get owner(): string {
    return this.repositoryFullName.split('/')[0];
  }

  get repo(): string {
    return this.repositoryFullName.split('/')[1];
  }

  // Check if branch has drifted (compare with new commit SHA)
  hasDrifted(currentCommitSha: string): boolean {
    return this.commitSha !== currentCommitSha;
  }

  // Equality check
  equals(other: RepositoryContext): boolean {
    return (
      this.repositoryFullName === other.repositoryFullName &&
      this.branchName === other.branchName &&
      this.commitSha === other.commitSha
    );
  }

  // For logging/debugging
  toString(): string {
    return `${this.repositoryFullName}@${this.branchName} (${this.commitSha.substring(0, 7)})`;
  }
}
