import { Timestamp } from 'firebase-admin/firestore';
import { Session } from '../../domain/Session';
import { SessionStatus } from '../../domain/SessionStatus';

/** Safely convert Firestore Timestamp, {_seconds,_nanoseconds}, or ISO string to Date */
function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value && typeof (value as { _seconds: number })._seconds === 'number') {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  return new Date(value as string | number);
}

export interface SessionDocument {
  id: string;
  ticketId: string;
  teamId: string;
  userId: string;
  ticketTitle: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  status: string;
  sandboxId: string | null;
  error: string | null;
  costUsd: number | null;
  prUrl: string | null;
  prNumber: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

export class SessionMapper {
  static toDomain(doc: SessionDocument): Session {
    return Session.reconstitute({
      id: doc.id,
      ticketId: doc.ticketId,
      teamId: doc.teamId,
      userId: doc.userId,
      ticketTitle: doc.ticketTitle,
      repoOwner: doc.repoOwner,
      repoName: doc.repoName,
      branch: doc.branch,
      status: doc.status as SessionStatus,
      sandboxId: doc.sandboxId ?? null,
      error: doc.error ?? null,
      costUsd: doc.costUsd ?? null,
      prUrl: doc.prUrl ?? null,
      prNumber: doc.prNumber ?? null,
      createdAt: toDate(doc.createdAt),
      updatedAt: toDate(doc.updatedAt),
      completedAt: doc.completedAt ? toDate(doc.completedAt) : null,
    });
  }

  static toFirestore(session: Session): SessionDocument {
    return {
      id: session.id,
      ticketId: session.ticketId,
      teamId: session.teamId,
      userId: session.userId,
      ticketTitle: session.ticketTitle,
      repoOwner: session.repoOwner,
      repoName: session.repoName,
      branch: session.branch,
      status: session.status,
      sandboxId: session.sandboxId,
      error: session.error,
      costUsd: session.costUsd,
      prUrl: session.prUrl,
      prNumber: session.prNumber,
      createdAt: Timestamp.fromDate(session.createdAt),
      updatedAt: Timestamp.fromDate(session.updatedAt),
      completedAt: session.completedAt ? Timestamp.fromDate(session.completedAt) : null,
    };
  }
}
