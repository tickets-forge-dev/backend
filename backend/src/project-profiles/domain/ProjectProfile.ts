import { randomUUID } from 'crypto';
import {
  ProjectProfileStatus,
  VALID_PROFILE_TRANSITIONS,
} from './ProjectProfileStatus';
import { InvalidProfileTransitionError } from './InvalidProfileTransitionError';

// Re-export for convenience
export { InvalidProfileTransitionError } from './InvalidProfileTransitionError';

export class ProjectProfile {
  private constructor(
    private readonly _id: string,
    private readonly _teamId: string,
    private readonly _repoOwner: string,
    private readonly _repoName: string,
    private readonly _branch: string,
    private _profileContent: string | null,
    private _status: ProjectProfileStatus,
    private _scannedAt: Date | null,
    private _scannedBy: string | null,
    private _fileCount: number,
    private _techStack: string[],
    private _commitSha: string | null,
    private _error: string | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * Factory method for creating a new profile.
   * Initializes with status 'pending'.
   */
  static createNew(
    teamId: string,
    repoOwner: string,
    repoName: string,
    branch: string,
    scannedBy: string,
  ): ProjectProfile {
    const now = new Date();
    return new ProjectProfile(
      `profile_${randomUUID()}`,
      teamId,
      repoOwner,
      repoName,
      branch,
      null,
      'pending',
      null,
      scannedBy,
      0,
      [],
      null,
      null,
      now,
      now,
    );
  }

  /**
   * Factory method for reconstituting a profile from persistence.
   * No validation — trusts the data layer.
   */
  static reconstitute(props: {
    id: string;
    teamId: string;
    repoOwner: string;
    repoName: string;
    branch: string;
    profileContent: string | null;
    status: ProjectProfileStatus;
    scannedAt: Date | null;
    scannedBy: string | null;
    fileCount: number;
    techStack: string[];
    commitSha: string | null;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectProfile {
    return new ProjectProfile(
      props.id,
      props.teamId,
      props.repoOwner,
      props.repoName,
      props.branch,
      props.profileContent,
      props.status,
      props.scannedAt,
      props.scannedBy,
      props.fileCount,
      props.techStack,
      props.commitSha,
      props.error,
      props.createdAt,
      props.updatedAt,
    );
  }

  // --- Status transition methods ---

  markScanning(): void {
    this.transitionTo('scanning');
    this._updatedAt = new Date();
  }

  markReady(
    content: string,
    fileCount: number,
    techStack: string[],
    commitSha: string,
  ): void {
    this.transitionTo('ready');
    this._profileContent = content;
    this._fileCount = fileCount;
    this._techStack = techStack;
    this._commitSha = commitSha;
    const now = new Date();
    this._scannedAt = now;
    this._updatedAt = now;
  }

  markFailed(error: string): void {
    this.transitionTo('failed');
    this._error = error;
    this._updatedAt = new Date();
  }

  // --- Query methods ---

  /**
   * Returns true if the profile's commitSha differs from the given sha.
   * A stale profile is still usable (90%+ accurate) but could be re-scanned.
   */
  isStale(currentCommitSha: string): boolean {
    if (!this._commitSha) return true;
    return this._commitSha !== currentCommitSha;
  }

  isReady(): boolean {
    return this._status === 'ready';
  }

  isScanning(): boolean {
    return this._status === 'scanning';
  }

  get repoFullName(): string {
    return `${this._repoOwner}/${this._repoName}`;
  }

  // --- Private helpers ---

  private transitionTo(target: ProjectProfileStatus): void {
    const allowed = VALID_PROFILE_TRANSITIONS[this._status];
    if (!allowed.includes(target)) {
      throw new InvalidProfileTransitionError(this._status, target);
    }
    this._status = target;
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }

  get teamId(): string {
    return this._teamId;
  }

  get repoOwner(): string {
    return this._repoOwner;
  }

  get repoName(): string {
    return this._repoName;
  }

  get branch(): string {
    return this._branch;
  }

  get profileContent(): string | null {
    return this._profileContent;
  }

  get status(): ProjectProfileStatus {
    return this._status;
  }

  get scannedAt(): Date | null {
    return this._scannedAt;
  }

  get scannedBy(): string | null {
    return this._scannedBy;
  }

  get fileCount(): number {
    return this._fileCount;
  }

  get techStack(): string[] {
    return this._techStack;
  }

  get commitSha(): string | null {
    return this._commitSha;
  }

  get error(): string | null {
    return this._error;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Returns a plain object representation suitable for JSON serialization.
   * Needed because NestJS cannot serialize private-field domain entities.
   */
  toPlainObject(): Record<string, unknown> {
    return {
      id: this.id,
      teamId: this.teamId,
      repoOwner: this.repoOwner,
      repoName: this.repoName,
      branch: this.branch,
      profileContent: this.profileContent,
      status: this.status,
      scannedAt: this.scannedAt?.toISOString() ?? null,
      scannedBy: this.scannedBy,
      fileCount: this.fileCount,
      techStack: this.techStack,
      commitSha: this.commitSha,
      error: this.error,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
