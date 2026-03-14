import { Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { AECRepository } from '../../application/ports/AECRepository';
import { AEC } from '../../domain/aec/AEC';
import { AECMapper, AECDocument } from './mappers/AECMapper';
import { AECNotFoundError } from '../../../shared/domain/exceptions/DomainExceptions';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

/** Recursively strip values Firestore rejects (undefined, NaN, Infinity, functions) */
function stripUndefined(obj: any, depth = 0): any {
  // Firestore max nesting depth is 20
  if (depth > 19) return null;
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'function') return null;
  if (typeof obj === 'number' && !isFinite(obj)) return null; // NaN, Infinity
  if (Array.isArray(obj)) return obj.map((item) => stripUndefined(item, depth + 1));
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) clean[k] = stripUndefined(v, depth + 1);
    }
    return clean;
  }
  return obj;
}

@Injectable()
export class FirestoreAECRepository implements AECRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  async save(aec: AEC): Promise<void> {
    const firestore = this.getFirestore();
    const doc = AECMapper.toFirestore(aec);

    const path = `teams/${aec.teamId}/aecs/${aec.id}`;
    console.log(`📝 [FirestoreAECRepository] Saving AEC to path: ${path}`);
    console.log(`📝 [FirestoreAECRepository] Document data:`, {
      id: doc.id,
      teamId: doc.teamId,
      title: doc.title,
      status: doc.status,
    });

    const batch = firestore.batch();

    // Write ticket document
    const docRef = firestore
      .collection('teams')
      .doc(aec.teamId)
      .collection('aecs')
      .doc(aec.id);
    batch.set(docRef, stripUndefined(doc));

    // Write lookup index so findById can resolve teamId without a collectionGroup query
    const lookupRef = firestore.collection('aec_lookup').doc(aec.id);
    batch.set(lookupRef, { teamId: aec.teamId });

    await batch.commit();

    console.log(`✅ AEC saved successfully to Firestore at ${path}`);
  }

  async findById(id: string): Promise<AEC | null> {
    const firestore = this.getFirestore();

    try {
      // Step 1: Resolve teamId from lightweight lookup index (avoids collectionGroup index requirement)
      const lookupDoc = await firestore.collection('aec_lookup').doc(id).get();

      let teamId: string;

      if (lookupDoc.exists) {
        teamId = (lookupDoc.data() as { teamId: string }).teamId;
      } else {
        // Fallback: lookup missing (ticket predates lookup migration) — collectionGroup query
        console.warn(`⚠️ [FirestoreAECRepository] Lookup missing for ${id}, falling back to collectionGroup`);
        const snapshot = await firestore
          .collectionGroup('aecs')
          .where('id', '==', id)
          .limit(1)
          .get();

        if (snapshot.empty) {
          return null;
        }

        const data = snapshot.docs[0].data() as AECDocument;
        teamId = data.teamId;

        // Self-heal: write the missing lookup so future requests are fast
        await firestore.collection('aec_lookup').doc(id).set({ teamId });
        console.log(`✅ [FirestoreAECRepository] Healed missing lookup for ${id} → team ${teamId}`);
      }

      // Step 2: Fetch full ticket document using known path
      const docRef = firestore
        .collection('teams')
        .doc(teamId)
        .collection('aecs')
        .doc(id);
      const snap = await docRef.get();

      if (!snap.exists) {
        return null;
      }

      return AECMapper.toDomain(snap.data() as AECDocument);
    } catch (error) {
      console.error('❌ [FirestoreAECRepository] findById error:', error);
      return null;
    }
  }

  async findByIdInTeam(id: string, teamId: string): Promise<AEC | null> {
    const firestore = this.getFirestore();

    try {
      const docRef = firestore
        .collection('teams')
        .doc(teamId)
        .collection('aecs')
        .doc(id);
      const snap = await docRef.get();

      if (!snap.exists) {
        return null;
      }

      // Self-heal: ensure lookup index exists for future findById calls
      const lookupRef = firestore.collection('aec_lookup').doc(id);
      const lookupDoc = await lookupRef.get();
      if (!lookupDoc.exists) {
        await lookupRef.set({ teamId });
      }

      return AECMapper.toDomain(snap.data() as AECDocument);
    } catch (error) {
      console.error('❌ [FirestoreAECRepository] findByIdInTeam error:', error);
      return null;
    }
  }

  async countByTeam(teamId: string): Promise<number> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .count()
      .get();

    // Subtract archived count to avoid needing a composite index
    const archivedSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .where('status', '==', 'archived')
      .count()
      .get();

    return snapshot.data().count - archivedSnapshot.data().count;
  }

  async countByTeamAndCreator(teamId: string, createdBy: string): Promise<number> {
    const firestore = this.getFirestore();
    // Fetch all by creator, then filter out archived in memory
    const snapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .where('createdBy', '==', createdBy)
      .get();

    return snapshot.docs.filter((doc) => (doc.data() as any).status !== 'archived').length;
  }

  async findByTeam(teamId: string): Promise<AEC[]> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs
      .map((doc) => AECMapper.toDomain(doc.data() as AECDocument))
      .filter((aec) => aec.status !== 'archived');
  }

  async findArchivedByTeam(teamId: string): Promise<AEC[]> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .where('status', '==', 'archived')
      .get();

    return snapshot.docs
      .map((doc) => AECMapper.toDomain(doc.data() as AECDocument))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async update(aec: AEC): Promise<void> {
    const firestore = this.getFirestore();
    const doc = AECMapper.toFirestore(aec);
    const docRef = firestore
      .collection('teams')
      .doc(aec.teamId)
      .collection('aecs')
      .doc(aec.id);

    const exists = await docRef.get();
    if (!exists.exists) {
      throw new AECNotFoundError(aec.id);
    }

    await docRef.update(stripUndefined(doc) as any);
  }

  async delete(aecId: string, teamId: string): Promise<void> {
    const firestore = this.getFirestore();
    const path = `teams/${teamId}/aecs/${aecId}`;
    console.log(`🗑️ [FirestoreAECRepository] Deleting AEC from path: ${path}`);

    const docRef = firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .doc(aecId);

    const exists = await docRef.get();
    if (!exists.exists) {
      throw new AECNotFoundError(aecId);
    }

    await docRef.delete();
    console.log(`✅ [FirestoreAECRepository] AEC deleted successfully from ${path}`);
  }

  /**
   * Story 12-2: Update a ticket's folderId (move to folder or back to root)
   */
  async updateTicketFolder(
    ticketId: string,
    teamId: string,
    folderId: string | null,
  ): Promise<void> {
    const firestore = this.getFirestore();
    const docRef = firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .doc(ticketId);

    const exists = await docRef.get();
    if (!exists.exists) {
      throw new AECNotFoundError(ticketId);
    }

    await docRef.update({
      folderId: folderId,
      updatedAt: new Date(),
    });
  }

  /**
   * Story 12-2: Clear folderId from all tickets in a folder (when folder is deleted)
   */
  async clearFolderFromTickets(teamId: string, folderId: string): Promise<void> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .where('folderId', '==', folderId)
      .get();

    if (snapshot.empty) return;

    const batch = firestore.batch();
    for (const doc of snapshot.docs) {
      batch.update(doc.ref, { folderId: null, updatedAt: new Date() });
    }
    await batch.commit();
  }
}
