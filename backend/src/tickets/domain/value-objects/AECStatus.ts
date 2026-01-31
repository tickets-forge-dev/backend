export enum AECStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  READY = 'ready',
  CREATED = 'created',
  DRIFTED = 'drifted',
}

export type TicketType = 'feature' | 'bug' | 'task';
