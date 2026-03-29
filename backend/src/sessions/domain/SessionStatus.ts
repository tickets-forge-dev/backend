export enum SessionStatus {
  PROVISIONING = 'provisioning',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export const VALID_SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  [SessionStatus.PROVISIONING]: [SessionStatus.RUNNING, SessionStatus.FAILED, SessionStatus.CANCELLED],
  [SessionStatus.RUNNING]: [SessionStatus.COMPLETED, SessionStatus.FAILED, SessionStatus.CANCELLED],
  [SessionStatus.COMPLETED]: [],
  [SessionStatus.FAILED]: [],
  [SessionStatus.CANCELLED]: [],
};

export const TERMINAL_SESSION_STATUSES: ReadonlySet<SessionStatus> = new Set([
  SessionStatus.COMPLETED,
  SessionStatus.FAILED,
  SessionStatus.CANCELLED,
]);

export const ACTIVE_SESSION_STATUSES: ReadonlySet<SessionStatus> = new Set([
  SessionStatus.PROVISIONING,
  SessionStatus.RUNNING,
]);
