import { randomUUID } from 'crypto';

export enum ExecutionEventType {
  DECISION = 'decision',
  RISK = 'risk',
  SCOPE_CHANGE = 'scope_change',
}

export interface ExecutionEvent {
  id: string;
  type: ExecutionEventType;
  title: string;
  description: string;
  createdAt: Date;
}

export interface CreateExecutionEventInput {
  type: ExecutionEventType;
  title: string;
  description: string;
}

export function createExecutionEvent(input: CreateExecutionEventInput): ExecutionEvent {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Title is required');
  }
  if (!input.description || input.description.trim().length === 0) {
    throw new Error('Description is required');
  }

  return {
    id: `evt_${randomUUID()}`,
    type: input.type,
    title: input.title.trim(),
    description: input.description.trim(),
    createdAt: new Date(),
  };
}
