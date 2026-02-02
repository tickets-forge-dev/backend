/**
 * GitHub Repository DTOs
 *
 * Request/Response DTOs for GitHub API endpoints.
 * Presentation Layer
 */

export class RepositoryResponseDto {
  fullName!: string;
  defaultBranch!: string;
  isPrivate!: boolean;
  description!: string | null;
}

export class BranchDto {
  name!: string;
  isDefault!: boolean;
  commitSha!: string;
  lastCommit!: {
    sha: string;
    author: string | null;
    date: string; // ISO string
    message: string;
  };
}

export class BranchesResponseDto {
  branches!: BranchDto[];
  defaultBranch!: string;
  totalCount!: number;
}
