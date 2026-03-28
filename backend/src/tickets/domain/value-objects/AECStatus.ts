export enum AECStatus {
  DRAFT = 'draft',
  DEFINED = 'defined',
  REFINED = 'refined',
  APPROVED = 'approved',
  EXECUTING = 'executing',
  DELIVERED = 'delivered',
  ARCHIVED = 'archived',
}

export type TicketType = 'feature' | 'bug' | 'task';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
