export enum AECStatus {
  DRAFT = 'draft',
  DEV_REFINING = 'dev-refining',
  REVIEW = 'review',
  FORGED = 'forged',
  EXECUTING = 'executing',
  COMPLETE = 'complete',
}

export type TicketType = 'feature' | 'bug' | 'task';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
