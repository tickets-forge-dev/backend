export enum AECStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  READY = 'ready',
  WAITING_FOR_APPROVAL = 'waiting-for-approval',
  CREATED = 'created',
  DRIFTED = 'drifted',
  COMPLETE = 'complete',
}

export type TicketType = 'feature' | 'bug' | 'task';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
