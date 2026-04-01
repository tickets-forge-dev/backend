/**
 * Repository Entry Interface
 *
 * Represents a single repository linked to an AEC in the multi-repo model.
 * Each ticket can have multiple repositories, with one designated as primary.
 *
 * Domain Layer - No framework dependencies
 */

export interface RepositoryEntry {
  repositoryFullName: string; // "owner/repo"
  branchName: string; // source branch ("main")
  commitSha: string; // HEAD at attach time
  isDefaultBranch: boolean;
  isPrimary: boolean; // first attached = primary
  role?: string; // "backend" | "frontend" | "shared"
  selectedAt: Date;
}
