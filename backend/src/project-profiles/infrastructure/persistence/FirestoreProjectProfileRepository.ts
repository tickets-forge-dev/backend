import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { ProjectProfileRepository } from '../../application/ports/ProjectProfileRepository.port';
import { ProjectProfile } from '../../domain/ProjectProfile';
import {
  ProjectProfileMapper,
  ProjectProfileDocument,
} from '../mappers/ProjectProfileMapper';
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
export class FirestoreProjectProfileRepository implements ProjectProfileRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  async save(profile: ProjectProfile): Promise<void> {
    const firestore = this.getFirestore();
    const doc = ProjectProfileMapper.toFirestore(profile);
    const path = `teams/${profile.teamId}/project-profiles/${profile.id}`;

    try {
      await firestore
        .collection('teams')
        .doc(profile.teamId)
        .collection('project-profiles')
        .doc(profile.id)
        .set(stripUndefined(doc) as FirebaseFirestore.DocumentData, { merge: true });
    } catch (error) {
      console.error(`[FirestoreProjectProfileRepository] save error at ${path}:`, error);
      throw error;
    }
  }

  async findById(profileId: string, teamId: string): Promise<ProjectProfile | null> {
    const firestore = this.getFirestore();

    try {
      const snap = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('project-profiles')
        .doc(profileId)
        .get();

      if (!snap.exists) {
        return null;
      }

      return ProjectProfileMapper.toDomain(snap.data() as ProjectProfileDocument);
    } catch (error) {
      console.error(
        `[FirestoreProjectProfileRepository] findById error for ${profileId}:`,
        error,
      );
      return null;
    }
  }

  async findByRepo(
    teamId: string,
    repoOwner: string,
    repoName: string,
  ): Promise<ProjectProfile | null> {
    const firestore = this.getFirestore();

    try {
      // Single-field query on repoOwner, filter repoName in code (avoids composite index)
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('project-profiles')
        .where('repoOwner', '==', repoOwner)
        .get();

      const match = snapshot.docs
        .map((doc) => ProjectProfileMapper.toDomain(doc.data() as ProjectProfileDocument))
        .find((p) => p.repoName === repoName);

      return match ?? null;
    } catch (error) {
      console.error(
        `[FirestoreProjectProfileRepository] findByRepo error for ${repoOwner}/${repoName}:`,
        error,
      );
      return null;
    }
  }

  async findAllByTeam(teamId: string): Promise<ProjectProfile[]> {
    const firestore = this.getFirestore();

    try {
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('project-profiles')
        .get();

      return snapshot.docs.map((doc) =>
        ProjectProfileMapper.toDomain(doc.data() as ProjectProfileDocument),
      );
    } catch (error) {
      console.error(
        `[FirestoreProjectProfileRepository] findAllByTeam error for ${teamId}:`,
        error,
      );
      return [];
    }
  }

  async delete(profileId: string, teamId: string): Promise<void> {
    const firestore = this.getFirestore();

    try {
      await firestore
        .collection('teams')
        .doc(teamId)
        .collection('project-profiles')
        .doc(profileId)
        .delete();
    } catch (error) {
      console.error(
        `[FirestoreProjectProfileRepository] delete error for ${profileId}:`,
        error,
      );
      throw error;
    }
  }
}
