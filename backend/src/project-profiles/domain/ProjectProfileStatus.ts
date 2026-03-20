export type ProjectProfileStatus = 'pending' | 'scanning' | 'ready' | 'failed';

export const VALID_PROFILE_TRANSITIONS: Record<ProjectProfileStatus, ProjectProfileStatus[]> = {
  pending: ['scanning'],
  scanning: ['ready', 'failed'],
  ready: ['scanning'], // Allow re-scan from ready state
  failed: ['scanning'], // Allow re-scan from failed state
};

export const TERMINAL_PROFILE_STATUSES: ReadonlySet<ProjectProfileStatus> = new Set([
  'ready',
  'failed',
]);
