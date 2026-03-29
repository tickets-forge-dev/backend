import { randomUUID } from 'crypto';
import { SessionStatus, VALID_SESSION_TRANSITIONS, TERMINAL_SESSION_STATUSES, ACTIVE_SESSION_STATUSES } from './SessionStatus';
import { InvalidSessionTransitionError } from './InvalidSessionTransitionError';

interface CreateSessionProps {
  ticketId: string;
  teamId: string;
  userId: string;
  ticketTitle: string;
  repoOwner: string;
  repoName: string;
  branch: string;
}

export class Session {
  private constructor(
    private readonly _id: string,
    private readonly _ticketId: string,
    private readonly _teamId: string,
    private readonly _userId: string,
    private readonly _ticketTitle: string,
    private readonly _repoOwner: string,
    private readonly _repoName: string,
    private readonly _branch: string,
    private _status: SessionStatus,
    private _sandboxId: string | null,
    private _error: string | null,
    private _costUsd: number | null,
    private _prUrl: string | null,
    private _prNumber: number | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _completedAt: Date | null,
  ) {}

  static createNew(props: CreateSessionProps): Session {
    const now = new Date();
    return new Session(
      `session_${randomUUID()}`,
      props.ticketId,
      props.teamId,
      props.userId,
      props.ticketTitle,
      props.repoOwner,
      props.repoName,
      props.branch,
      SessionStatus.PROVISIONING,
      null, null, null, null, null,
      now, now, null,
    );
  }

  static reconstitute(props: {
    id: string; ticketId: string; teamId: string; userId: string;
    ticketTitle: string; repoOwner: string; repoName: string; branch: string;
    status: SessionStatus; sandboxId: string | null; error: string | null;
    costUsd: number | null; prUrl: string | null; prNumber: number | null;
    createdAt: Date | string; updatedAt: Date | string; completedAt: Date | string | null;
  }): Session {
    return new Session(
      props.id, props.ticketId, props.teamId, props.userId,
      props.ticketTitle, props.repoOwner, props.repoName, props.branch,
      props.status, props.sandboxId, props.error, props.costUsd,
      props.prUrl, props.prNumber,
      new Date(props.createdAt),
      new Date(props.updatedAt),
      props.completedAt ? new Date(props.completedAt) : null,
    );
  }

  markRunning(sandboxId: string): void {
    this.transitionTo(SessionStatus.RUNNING);
    this._sandboxId = sandboxId;
    this._updatedAt = new Date();
  }

  markCompleted(costUsd: number, prUrl: string, prNumber: number): void {
    if (this._status === SessionStatus.CANCELLED) return;
    this.transitionTo(SessionStatus.COMPLETED);
    this._costUsd = costUsd;
    this._prUrl = prUrl;
    this._prNumber = prNumber;
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  markFailed(error: string): void {
    if (this._status === SessionStatus.CANCELLED) return;
    this.transitionTo(SessionStatus.FAILED);
    this._error = error;
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  markCancelled(): void {
    this.transitionTo(SessionStatus.CANCELLED);
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  isActive(): boolean { return ACTIVE_SESSION_STATUSES.has(this._status); }
  isTerminal(): boolean { return TERMINAL_SESSION_STATUSES.has(this._status); }

  private transitionTo(target: SessionStatus): void {
    const allowed = VALID_SESSION_TRANSITIONS[this._status];
    if (!allowed.includes(target)) {
      throw new InvalidSessionTransitionError(this._status, target);
    }
    this._status = target;
  }

  get id(): string { return this._id; }
  get ticketId(): string { return this._ticketId; }
  get teamId(): string { return this._teamId; }
  get userId(): string { return this._userId; }
  get ticketTitle(): string { return this._ticketTitle; }
  get repoOwner(): string { return this._repoOwner; }
  get repoName(): string { return this._repoName; }
  get branch(): string { return this._branch; }
  get status(): SessionStatus { return this._status; }
  get sandboxId(): string | null { return this._sandboxId; }
  get error(): string | null { return this._error; }
  get costUsd(): number | null { return this._costUsd; }
  get prUrl(): string | null { return this._prUrl; }
  get prNumber(): number | null { return this._prNumber; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get completedAt(): Date | null { return this._completedAt; }

  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id, ticketId: this._ticketId, teamId: this._teamId,
      userId: this._userId, ticketTitle: this._ticketTitle,
      repoOwner: this._repoOwner, repoName: this._repoName, branch: this._branch,
      status: this._status, sandboxId: this._sandboxId, error: this._error,
      costUsd: this._costUsd, prUrl: this._prUrl, prNumber: this._prNumber,
      createdAt: this._createdAt.toISOString(), updatedAt: this._updatedAt.toISOString(),
      completedAt: this._completedAt?.toISOString() ?? null,
    };
  }
}
