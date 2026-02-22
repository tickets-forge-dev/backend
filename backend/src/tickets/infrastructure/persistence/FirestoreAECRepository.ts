import { Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { AECRepository } from '../../application/ports/AECRepository';
import { AEC } from '../../domain/aec/AEC';
import { AECMapper, AECDocument } from './mappers/AECMapper';
import { AECNotFoundError } from '../../../shared/domain/exceptions/DomainExceptions';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

/** Recursively strip undefined values (Firestore rejects them) */
function stripUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) clean[k] = stripUndefined(v);
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
      if (!lookupDoc.exists) {
        return null;
      }
      const { teamId } = lookupDoc.data() as { teamId: string };

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

  async countByTeam(teamId: string): Promise<number> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .count()
      .get();

    return snapshot.data().count;
  }

  async countByTeamAndCreator(teamId: string, createdBy: string): Promise<number> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .where('createdBy', '==', createdBy)
      .count()
      .get();

    return snapshot.data().count;
  }

  async findByTeam(teamId: string): Promise<AEC[]> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('aecs')
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => AECMapper.toDomain(doc.data() as AECDocument));
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
}
