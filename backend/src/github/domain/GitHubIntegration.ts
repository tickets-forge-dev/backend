/**
 * GitHubIntegration Entity
 *
 * Core domain entity representing a workspace's GitHub integration.
 * Manages GitHub connection state, access tokens, and repository selections.
 *
 * Part of: Story 4.1 - GitHub App Integration
 * Layer: Domain (no external dependencies)
 *
 * Business Rules:
 * - One integration per workspace
 * - Access token must be encrypted before storage
 * - Cannot select repositories without valid connection
 * - Connection can be disconnected, clearing all data
 */

import { GitHubRepository } from './GitHubRepository';

export interface GitHubIntegrationProps {
  id: string;
  workspaceId: string;
  installationId: number;
  accountLogin: string;
  accountType: 'User' | 'Organization';
  encryptedAccessToken: string;
  selectedRepositories: GitHubRepository[];
  connectedAt: Date;
  updatedAt: Date;
}

export class GitHubIntegration {
  private props: GitHubIntegrationProps;

  private constructor(props: GitHubIntegrationProps) {
    this.props = props;
  }

  /**
   * Create a new GitHub integration
   */
  static create(
    id: string,
    workspaceId: string,
    installationId: number,
    accountLogin: string,
    accountType: 'User' | 'Organization',
    encryptedAccessToken: string,
  ): GitHubIntegration {
    this.validateCreation({
      id,
      workspaceId,
      installationId,
      accountLogin,
      accountType,
      encryptedAccessToken,
    });

    const now = new Date();

    return new GitHubIntegration({
      id,
      workspaceId,
      installationId,
      accountLogin,
      accountType,
      encryptedAccessToken,
      selectedRepositories: [],
      connectedAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute integration from persistence
   */
  static reconstitute(props: GitHubIntegrationProps): GitHubIntegration {
    this.validateReconstitution(props);
    return new GitHubIntegration(props);
  }

  private static validateCreation(params: {
    id: string;
    workspaceId: string;
    installationId: number;
    accountLogin: string;
    accountType: string;
    encryptedAccessToken: string;
  }): void {
    if (!params.id || params.id.trim() === '') {
      throw new Error('Integration ID is required');
    }

    if (!params.workspaceId || params.workspaceId.trim() === '') {
      throw new Error('Workspace ID is required');
    }

    if (!params.installationId || params.installationId <= 0) {
      throw new Error('Valid installation ID is required');
    }

    if (!params.accountLogin || params.accountLogin.trim() === '') {
      throw new Error('Account login is required');
    }

    if (params.accountType !== 'User' && params.accountType !== 'Organization') {
      throw new Error('Account type must be User or Organization');
    }

    if (!params.encryptedAccessToken || params.encryptedAccessToken.trim() === '') {
      throw new Error('Encrypted access token is required');
    }
  }

  private static validateReconstitution(props: GitHubIntegrationProps): void {
    this.validateCreation(props);

    if (!props.connectedAt || !(props.connectedAt instanceof Date)) {
      throw new Error('Valid connectedAt date is required');
    }

    if (!props.updatedAt || !(props.updatedAt instanceof Date)) {
      throw new Error('Valid updatedAt date is required');
    }

    if (!Array.isArray(props.selectedRepositories)) {
      throw new Error('selectedRepositories must be an array');
    }
  }

  /**
   * Select repositories for code indexing
   */
  selectRepositories(repositories: GitHubRepository[]): void {
    if (!Array.isArray(repositories)) {
      throw new Error('Repositories must be an array');
    }

    // Validate all repositories
    repositories.forEach((repo, index) => {
      if (!(repo instanceof GitHubRepository)) {
        throw new Error(`Invalid repository at index ${index}`);
      }
    });

    // Remove duplicates based on repository ID
    const uniqueRepos = this.removeDuplicateRepositories(repositories);

    this.props.selectedRepositories = uniqueRepos;
    this.props.updatedAt = new Date();
  }

  /**
   * Add repositories to selection
   */
  addRepositories(repositories: GitHubRepository[]): void {
    const combined = [...this.props.selectedRepositories, ...repositories];
    this.selectRepositories(combined);
  }

  /**
   * Remove repositories from selection
   */
  removeRepositories(repositoryIds: number[]): void {
    if (!Array.isArray(repositoryIds)) {
      throw new Error('Repository IDs must be an array');
    }

    const idsToRemove = new Set(repositoryIds);
    const filtered = this.props.selectedRepositories.filter((repo) => !idsToRemove.has(repo.id));

    this.props.selectedRepositories = filtered;
    this.props.updatedAt = new Date();
  }

  /**
   * Update access token (must be encrypted)
   */
  updateAccessToken(encryptedAccessToken: string): void {
    if (!encryptedAccessToken || encryptedAccessToken.trim() === '') {
      throw new Error('Encrypted access token is required');
    }

    this.props.encryptedAccessToken = encryptedAccessToken;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if repository is selected
   */
  isRepositorySelected(repositoryId: number): boolean {
    return this.props.selectedRepositories.some((repo) => repo.id === repositoryId);
  }

  /**
   * Get selected repository by ID
   */
  getRepository(repositoryId: number): GitHubRepository | undefined {
    return this.props.selectedRepositories.find((repo) => repo.id === repositoryId);
  }

  private removeDuplicateRepositories(repositories: GitHubRepository[]): GitHubRepository[] {
    const seen = new Map<number, GitHubRepository>();

    for (const repo of repositories) {
      if (!seen.has(repo.id)) {
        seen.set(repo.id, repo);
      }
    }

    return Array.from(seen.values());
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get installationId(): number {
    return this.props.installationId;
  }

  get accountLogin(): string {
    return this.props.accountLogin;
  }

  get accountType(): 'User' | 'Organization' {
    return this.props.accountType;
  }

  get encryptedAccessToken(): string {
    return this.props.encryptedAccessToken;
  }

  get selectedRepositories(): ReadonlyArray<GitHubRepository> {
    return Object.freeze([...this.props.selectedRepositories]);
  }

  get connectedAt(): Date {
    return new Date(this.props.connectedAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  get hasSelectedRepositories(): boolean {
    return this.props.selectedRepositories.length > 0;
  }

  get selectedRepositoryCount(): number {
    return this.props.selectedRepositories.length;
  }

  // Serialization
  toObject(): GitHubIntegrationProps {
    return {
      ...this.props,
      connectedAt: new Date(this.props.connectedAt),
      updatedAt: new Date(this.props.updatedAt),
      selectedRepositories: this.props.selectedRepositories.map((repo) =>
        GitHubRepository.create(repo.toObject()),
      ),
    };
  }
}
