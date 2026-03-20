import { GenerationJob } from '../../domain/GenerationJob';

export interface JobRepository {
  save(job: GenerationJob): Promise<void>;
  findById(jobId: string, teamId: string): Promise<GenerationJob | null>;
  findActiveByUser(userId: string, teamId: string): Promise<GenerationJob[]>;
  findActiveByTicket(ticketId: string, teamId: string): Promise<GenerationJob | null>;
  findRecentByUser(userId: string, teamId: string): Promise<GenerationJob[]>; // last 24h
  findOrphaned(): Promise<GenerationJob[]>; // status in ['running', 'retrying'] across all teams (collection group query)
  updateProgress(jobId: string, teamId: string, phase: string, percent: number): Promise<void>;
  getStatus(jobId: string, teamId: string): Promise<string | null>;
  pruneExpired(teamId: string): Promise<number>; // returns count pruned
}

export const JOB_REPOSITORY = Symbol('JobRepository');
