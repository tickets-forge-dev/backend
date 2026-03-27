import { ExecutionEvent, ExecutionEventType } from './ExecutionEvent';

export enum ChangeRecordStatus {
  AWAITING_REVIEW = 'awaiting_review',
  ACCEPTED = 'accepted',
  CHANGES_REQUESTED = 'changes_requested',
}

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

export interface Divergence {
  area: string;
  intended: string;
  actual: string;
  justification: string;
}

export interface ChangeRecord {
  executionSummary: string;
  decisions: ExecutionEvent[];
  risks: ExecutionEvent[];
  scopeChanges: ExecutionEvent[];
  filesChanged: FileChange[];
  divergences: Divergence[];
  hasDivergence: boolean;
  status: ChangeRecordStatus;
  reviewNote: string | null;
  reviewedAt: Date | null;
  submittedAt: Date;
}

export interface CreateChangeRecordInput {
  executionSummary: string;
  events: ExecutionEvent[];
  filesChanged: FileChange[];
  divergences: Divergence[];
}

export function createChangeRecord(input: CreateChangeRecordInput): ChangeRecord {
  if (!input.executionSummary || input.executionSummary.trim().length === 0) {
    throw new Error('Execution summary is required');
  }

  return {
    executionSummary: input.executionSummary.trim(),
    decisions: input.events.filter((e) => e.type === ExecutionEventType.DECISION),
    risks: input.events.filter((e) => e.type === ExecutionEventType.RISK),
    scopeChanges: input.events.filter((e) => e.type === ExecutionEventType.SCOPE_CHANGE),
    filesChanged: input.filesChanged,
    divergences: input.divergences,
    hasDivergence: input.divergences.length > 0,
    status: ChangeRecordStatus.AWAITING_REVIEW,
    reviewNote: null,
    reviewedAt: null,
    submittedAt: new Date(),
  };
}

export function acceptChangeRecord(record: ChangeRecord): ChangeRecord {
  return {
    ...record,
    status: ChangeRecordStatus.ACCEPTED,
    reviewedAt: new Date(),
  };
}

export function requestChangesOnRecord(record: ChangeRecord, note: string): ChangeRecord {
  if (!note || note.trim().length === 0) {
    throw new Error('Review note is required when requesting changes');
  }

  return {
    ...record,
    status: ChangeRecordStatus.CHANGES_REQUESTED,
    reviewNote: note.trim(),
    reviewedAt: new Date(),
  };
}
