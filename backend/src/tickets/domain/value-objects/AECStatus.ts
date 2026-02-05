export enum AECStatus {
  DRAFT = 'draft',
  IN_QUESTION_ROUND_1 = 'in-question-round-1',
  IN_QUESTION_ROUND_2 = 'in-question-round-2',
  IN_QUESTION_ROUND_3 = 'in-question-round-3',
  QUESTIONS_COMPLETE = 'questions-complete',
  VALIDATED = 'validated',
  READY = 'ready',
  CREATED = 'created',
  DRIFTED = 'drifted',
}

export type TicketType = 'feature' | 'bug' | 'task';
