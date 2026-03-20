import { Timestamp } from 'firebase-admin/firestore';
import { GenerationJob, JobStatus, JobType } from '../../domain/GenerationJob';

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

export interface JobDocument {
  id: string;
  teamId: string;
  ticketId: string;
  ticketTitle: string;
  createdBy: string;
  status: string;
  phase: string | null;
  percent: number;
  attempt: number;
  previousJobId: string | null;
  error: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  type: string;
}

export class JobMapper {
  static toDomain(doc: JobDocument): GenerationJob {
    return GenerationJob.reconstitute({
      id: doc.id,
      teamId: doc.teamId,
      ticketId: doc.ticketId,
      ticketTitle: doc.ticketTitle,
      createdBy: doc.createdBy,
      status: doc.status as JobStatus,
      phase: doc.phase ?? null,
      percent: doc.percent ?? 0,
      attempt: doc.attempt ?? 1,
      previousJobId: doc.previousJobId ?? null,
      error: doc.error ?? null,
      createdAt: toDate(doc.createdAt),
      updatedAt: toDate(doc.updatedAt),
      completedAt: doc.completedAt ? toDate(doc.completedAt) : null,
      type: (doc.type as JobType) ?? 'finalization',
    });
  }

  static toFirestore(job: GenerationJob): JobDocument {
    return {
      id: job.id,
      teamId: job.teamId,
      ticketId: job.ticketId,
      ticketTitle: job.ticketTitle,
      createdBy: job.createdBy,
      status: job.status,
      phase: job.phase,
      percent: job.percent,
      attempt: job.attempt,
      previousJobId: job.previousJobId,
      error: job.error,
      createdAt: Timestamp.fromDate(job.createdAt),
      updatedAt: Timestamp.fromDate(job.updatedAt),
      completedAt: job.completedAt ? Timestamp.fromDate(job.completedAt) : null,
      type: job.type,
    };
  }
}
