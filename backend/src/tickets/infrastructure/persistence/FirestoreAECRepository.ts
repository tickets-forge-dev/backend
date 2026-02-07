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

    const path = `workspaces/${aec.workspaceId}/aecs/${aec.id}`;
    console.log(`📝 [FirestoreAECRepository] Saving AEC to path: ${path}`);
    console.log(`📝 [FirestoreAECRepository] Document data:`, {
      id: doc.id,
      workspaceId: doc.workspaceId,
      title: doc.title,
      status: doc.status,
    });

    const docRef = firestore
      .collection('workspaces')
      .doc(aec.workspaceId)
      .collection('aecs')
      .doc(aec.id);

    await docRef.set(stripUndefined(doc));

    console.log(`✅ AEC saved successfully to Firestore at ${path}`);
  }

  async findById(id: string): Promise<AEC | null> {
    const firestore = this.getFirestore();
    
    // Note: We use collectionGroup to find across all workspaces
    // This requires the workspaceId to be validated by auth guards
    // For now, we need to scan all workspaces (not ideal but works)
    
    try {
      // Get all workspaces
      const workspacesSnapshot = await firestore.collection('workspaces').listDocuments();
      
      // Try to find the AEC in each workspace
      for (const workspaceRef of workspacesSnapshot) {
        const aecRef = workspaceRef.collection('aecs').doc(id);
        const aecDoc = await aecRef.get();
        
        if (aecDoc.exists) {
          return AECMapper.toDomain(aecDoc.data() as AECDocument);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ [FirestoreAECRepository] findById error:', error);
      return null;
    }
  }

  async countByWorkspace(workspaceId: string): Promise<number> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection('aecs')
      .count()
      .get();

    return snapshot.data().count;
  }

  async findByWorkspace(workspaceId: string): Promise<AEC[]> {
    const firestore = this.getFirestore();
    const snapshot = await firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection('aecs')
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) =>
      AECMapper.toDomain(doc.data() as AECDocument),
    );
  }

  async update(aec: AEC): Promise<void> {
    const firestore = this.getFirestore();
    const doc = AECMapper.toFirestore(aec);
    const docRef = firestore
      .collection('workspaces')
      .doc(aec.workspaceId)
      .collection('aecs')
      .doc(aec.id);

    const exists = await docRef.get();
    if (!exists.exists) {
      throw new AECNotFoundError(aec.id);
    }

    await docRef.update(stripUndefined(doc) as any);
  }

  async delete(aecId: string, workspaceId: string): Promise<void> {
    const firestore = this.getFirestore();
    const path = `workspaces/${workspaceId}/aecs/${aecId}`;
    console.log(`🗑️ [FirestoreAECRepository] Deleting AEC from path: ${path}`);

    const docRef = firestore
      .collection('workspaces')
      .doc(workspaceId)
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
