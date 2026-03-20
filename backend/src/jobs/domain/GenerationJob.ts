import { randomUUID } from 'crypto';
import { InvalidJobTransitionError } from './InvalidJobTransitionError';

export type JobStatus = 'running' | 'retrying' | 'completed' | 'failed' | 'cancelled';

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  running: ['retrying', 'completed', 'failed', 'cancelled'],
  retrying: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
};

const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set(['completed', 'failed', 'cancelled']);
const ACTIVE_STATUSES: ReadonlySet<JobStatus> = new Set(['running', 'retrying']);

export class GenerationJob {
  private constructor(
    private readonly _id: string,
    private readonly _teamId: string,
    private readonly _ticketId: string,
    private readonly _ticketTitle: string,
    private readonly _createdBy: string,
    private _status: JobStatus,
    private _phase: string | null,
    private _percent: number,
    private _attempt: number,
    private readonly _previousJobId: string | null,
    private _error: string | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _completedAt: Date | null,
  ) {}

  /**
   * Factory method for creating a new generation job.
   * Initializes with status 'running', attempt 1, percent 0.
   */
  static createNew(
    teamId: string,
    ticketId: string,
    ticketTitle: string,
    createdBy: string,
    previousJobId?: string,
  ): GenerationJob {
    const now = new Date();
    return new GenerationJob(
      `job_${randomUUID()}`,
      teamId,
      ticketId,
      ticketTitle,
      createdBy,
      'running',
      null,
      0,
      1,
      previousJobId ?? null,
      null,
      now,
      now,
      null,
    );
  }

  /**
   * Factory method for reconstituting a job from persistence.
   * No validation — trusts the data layer.
   */
  static reconstitute(props: {
    id: string;
    teamId: string;
    ticketId: string;
    ticketTitle: string;
    createdBy: string;
    status: JobStatus;
    phase: string | null;
    percent: number;
    attempt: number;
    previousJobId: string | null;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
  }): GenerationJob {
    return new GenerationJob(
      props.id,
      props.teamId,
      props.ticketId,
      props.ticketTitle,
      props.createdBy,
      props.status,
      props.phase,
      props.percent,
      props.attempt,
      props.previousJobId,
      props.error,
      props.createdAt,
      props.updatedAt,
      props.completedAt,
    );
  }

  // --- Status transition methods ---

  /**
   * Transition to 'retrying'. Only valid from 'running'.
   */
  markRetrying(): void {
    this.transitionTo('retrying');
    this._attempt = 2;
    this._updatedAt = new Date();
  }

  /**
   * Transition to 'completed'. Only valid from 'running' or 'retrying'.
   * CRITICAL: No-op if current status is 'cancelled' (race condition guard).
   */
  markCompleted(): void {
    if (this._status === 'cancelled') {
      return; // Race condition guard: cancellation wins
    }
    this.transitionTo('completed');
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  /**
   * Transition to 'failed'. Only valid from 'running' or 'retrying'.
   * CRITICAL: No-op if current status is 'cancelled' (race condition guard).
   */
  markFailed(error: string): void {
    if (this._status === 'cancelled') {
      return; // Race condition guard: cancellation wins
    }
    this.transitionTo('failed');
    this._error = error;
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  /**
   * Transition to 'cancelled'. Only valid from 'running' or 'retrying'.
   */
  markCancelled(): void {
    this.transitionTo('cancelled');
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  // --- Helper methods ---

  /**
   * Update progress phase and percent. Only valid for active jobs.
   */
  updateProgress(phase: string, percent: number): void {
    this._phase = phase;
    this._percent = Math.max(0, Math.min(100, percent));
    this._updatedAt = new Date();
  }

  /**
   * Returns true if the job is still actively running (running or retrying).
   */
  isActive(): boolean {
    return ACTIVE_STATUSES.has(this._status);
  }

  /**
   * Returns true if the job has reached a terminal state (completed, failed, or cancelled).
   */
  isTerminal(): boolean {
    return TERMINAL_STATUSES.has(this._status);
  }

  // --- Private helpers ---

  private transitionTo(target: JobStatus): void {
    const allowed = VALID_TRANSITIONS[this._status];
    if (!allowed.includes(target)) {
      throw new InvalidJobTransitionError(this._status, target);
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

  get ticketId(): string {
    return this._ticketId;
  }

  get ticketTitle(): string {
    return this._ticketTitle;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get status(): JobStatus {
    return this._status;
  }

  get phase(): string | null {
    return this._phase;
  }

  get percent(): number {
    return this._percent;
  }

  get attempt(): number {
    return this._attempt;
  }

  get previousJobId(): string | null {
    return this._previousJobId;
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

  get completedAt(): Date | null {
    return this._completedAt;
  }
}
