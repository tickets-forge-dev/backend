import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { JobRepository } from '../../application/ports/JobRepository.port';
import { GenerationJob } from '../../domain/GenerationJob';
import { JobMapper, JobDocument } from '../mappers/JobMapper';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

/** Recursively strip values Firestore rejects (undefined, NaN, Infinity, functions) */
function stripUndefined(obj: unknown, depth = 0): unknown {
  if (depth > 19) return null;
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'function') return null;
  if (typeof obj === 'number' && !isFinite(obj)) return null;
  if (Array.isArray(obj)) return obj.map((item) => stripUndefined(item, depth + 1));
  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) clean[k] = stripUndefined(v, depth + 1);
    }
    return clean;
  }
  return obj;
}

@Injectable()
export class FirestoreJobRepository implements JobRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  async save(job: GenerationJob): Promise<void> {
    const firestore = this.getFirestore();
    const doc = JobMapper.toFirestore(job);
    const path = `teams/${job.teamId}/jobs/${job.id}`;

    try {
      await firestore
        .collection('teams')
        .doc(job.teamId)
        .collection('jobs')
        .doc(job.id)
        .set(stripUndefined(doc) as FirebaseFirestore.DocumentData, { merge: true });
    } catch (error) {
      console.error(`[FirestoreJobRepository] save error at ${path}:`, error);
      throw error;
    }
  }

  async findById(jobId: string, teamId: string): Promise<GenerationJob | null> {
    const firestore = this.getFirestore();

    try {
      const snap = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('jobs')
        .doc(jobId)
        .get();

      if (!snap.exists) {
        return null;
      }

      return JobMapper.toDomain(snap.data() as JobDocument);
    } catch (error) {
      console.error(`[FirestoreJobRepository] findById error for ${jobId}:`, error);
      return null;
    }
  }

  async findActiveByUser(userId: string, teamId: string): Promise<GenerationJob[]> {
    const firestore = this.getFirestore();

    try {
      // Single-field query, filter status in code (avoids composite index)
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('jobs')
        .where('createdBy', '==', userId)
        .get();

      const activeStatuses = new Set(['running', 'retrying']);
      return snapshot.docs
        .map((doc) => JobMapper.toDomain(doc.data() as JobDocument))
        .filter((job) => activeStatuses.has(job.status));
    } catch (error) {
      console.error(`[FirestoreJobRepository] findActiveByUser error for ${userId}:`, error);
      return [];
    }
  }

  async findActiveByTicket(ticketId: string, teamId: string): Promise<GenerationJob | null> {
    const firestore = this.getFirestore();

    try {
      // Single-field query, filter status in code
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('jobs')
        .where('ticketId', '==', ticketId)
        .get();

      const activeStatuses = new Set(['running', 'retrying']);
      const match = snapshot.docs
        .map((doc) => JobMapper.toDomain(doc.data() as JobDocument))
        .find((job) => activeStatuses.has(job.status));

      return match ?? null;
    } catch (error) {
      console.error(`[FirestoreJobRepository] findActiveByTicket error for ${ticketId}:`, error);
      return null;
    }
  }

  async findRecentByUser(userId: string, teamId: string): Promise<GenerationJob[]> {
    const firestore = this.getFirestore();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Single-field query, filter by time + sort in code
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('jobs')
        .where('createdBy', '==', userId)
        .get();

      return snapshot.docs
        .map((doc) => JobMapper.toDomain(doc.data() as JobDocument))
        .filter((job) => job.createdAt > twentyFourHoursAgo)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error(`[FirestoreJobRepository] findRecentByUser error for ${userId}:`, error);
      return [];
    }
  }

  async findOrphaned(): Promise<GenerationJob[]> {
    const firestore = this.getFirestore();

    try {
      // Collection group query — needs a collection group index on 'status'
      // If index is missing, log and return empty (recovery is best-effort)
      const snapshot = await firestore
        .collectionGroup('jobs')
        .where('status', 'in', ['running', 'retrying'])
        .get();

      return snapshot.docs.map((doc) => JobMapper.toDomain(doc.data() as JobDocument));
    } catch (error) {
      // FAILED_PRECONDITION = missing index — expected until index is created
      const errMsg = error instanceof Error ? error.message : '';
      if (errMsg.includes('FAILED_PRECONDITION') || errMsg.includes('requires an index')) {
        console.warn('[FirestoreJobRepository] findOrphaned: collection group index not yet created, skipping recovery');
      } else {
        console.error('[FirestoreJobRepository] findOrphaned error:', error);
      }
      return [];
    }
  }

  async updateProgress(
    jobId: string,
    teamId: string,
    phase: string,
    percent: number,
  ): Promise<void> {
    const firestore = this.getFirestore();

    try {
      await firestore
        .collection('teams')
        .doc(teamId)
        .collection('jobs')
        .doc(jobId)
        .update({
          phase,
          percent,
          updatedAt: Timestamp.now(),
        });
    } catch (error) {
      console.error(`[FirestoreJobRepository] updateProgress error for ${jobId}:`, error);
      throw error;
    }
  }

  async getStatus(jobId: string, teamId: string): Promise<string | null> {
    const firestore = this.getFirestore();

    try {
      const snap = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('jobs')
        .doc(jobId)
        .get();

      if (!snap.exists) {
        return null;
      }

      const data = snap.data() as JobDocument;
      return data.status;
    } catch (error) {
      console.error(`[FirestoreJobRepository] getStatus error for ${jobId}:`, error);
      return null;
    }
  }

  async pruneExpired(teamId: string): Promise<number> {
    const firestore = this.getFirestore();
    const twentyFourHoursAgo = Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    try {
      // Single-field query (no composite index needed), filter status in code
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('jobs')
        .where('createdAt', '<', twentyFourHoursAgo)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const terminalStatuses = new Set(['completed', 'failed', 'cancelled']);
      const toDelete = snapshot.docs.filter((doc) => {
        const data = doc.data() as JobDocument;
        return terminalStatuses.has(data.status);
      });

      if (toDelete.length === 0) {
        return 0;
      }

      const batch = firestore.batch();
      for (const doc of toDelete) {
        batch.delete(doc.ref);
      }
      await batch.commit();

      return toDelete.length;
    } catch (error) {
      console.error(`[FirestoreJobRepository] pruneExpired error for team ${teamId}:`, error);
      return 0;
    }
  }
}
