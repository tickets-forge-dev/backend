export type SessionStatus = 'idle' | 'provisioning' | 'running' | 'completed' | 'failed' | 'cancelled';

export type SessionEventType =
  | 'session.status'
  | 'event.message'
  | 'event.thinking'
  | 'event.tool_use'
  | 'event.file_diff'
  | 'event.file_create'
  | 'event.bash'
  | 'event.search'
  | 'event.tool_result'
  | 'event.summary'
  | 'event.unknown_tool';

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  timestamp: string;
  content?: string;
  tool?: string;
  toolUseId?: string;
  path?: string;
  command?: string;
  oldString?: string;
  newString?: string;
  output?: string;
  truncated?: boolean;
  costUsd?: number;
  durationMs?: number;
  numTurns?: number;
  params?: Record<string, unknown>;
  completed?: boolean;
}

export interface SessionSummary {
  prUrl: string | null;
  prNumber: number | null;
  filesChanged: number;
  costUsd: number;
  durationMs: number;
}

export interface QuotaInfo {
  remaining: number;
  limit: number;
  plan: string;
}
