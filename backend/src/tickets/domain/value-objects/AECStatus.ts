export enum AECStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  SUSPENDED_FINDINGS = 'suspended-findings',
  SUSPENDED_QUESTIONS = 'suspended-questions',
  VALIDATED = 'validated',
  READY = 'ready',
  CREATED = 'created',
  DRIFTED = 'drifted',
  FAILED = 'failed',
}

export type TicketType = 'feature' | 'bug' | 'task';

/**
 * State machine transition rules
 * Defines valid transitions between AEC statuses
 */
export const VALID_TRANSITIONS: Record<AECStatus, AECStatus[]> = {
  [AECStatus.DRAFT]: [AECStatus.GENERATING],
  [AECStatus.GENERATING]: [
    AECStatus.SUSPENDED_FINDINGS,
    AECStatus.SUSPENDED_QUESTIONS,
    AECStatus.VALIDATED,
    AECStatus.FAILED,
  ],
  [AECStatus.SUSPENDED_FINDINGS]: [
    AECStatus.GENERATING,
    AECStatus.DRAFT,
    AECStatus.FAILED,
  ],
  [AECStatus.SUSPENDED_QUESTIONS]: [
    AECStatus.GENERATING,
    AECStatus.VALIDATED,
    AECStatus.FAILED,
  ],
  [AECStatus.VALIDATED]: [AECStatus.READY],
  [AECStatus.READY]: [AECStatus.CREATED, AECStatus.DRIFTED],
  [AECStatus.CREATED]: [AECStatus.DRIFTED],
  [AECStatus.DRIFTED]: [AECStatus.DRAFT],
  [AECStatus.FAILED]: [AECStatus.DRAFT],
};

/**
 * Required fields for each status
 */
export const REQUIRED_FIELDS: Record<AECStatus, string[]> = {
  [AECStatus.DRAFT]: ['title'],
  [AECStatus.GENERATING]: ['title'],
  [AECStatus.SUSPENDED_FINDINGS]: ['title', 'preImplementationFindings'],
  [AECStatus.SUSPENDED_QUESTIONS]: ['title', 'questions'],
  [AECStatus.VALIDATED]: ['title', 'type', 'acceptanceCriteria'],
  [AECStatus.READY]: [
    'title',
    'type',
    'acceptanceCriteria',
    'codeSnapshot',
  ],
  [AECStatus.CREATED]: [
    'title',
    'type',
    'acceptanceCriteria',
    'externalIssue',
  ],
  [AECStatus.DRIFTED]: ['title', 'driftReason'],
  [AECStatus.FAILED]: ['title', 'failureReason'],
};
