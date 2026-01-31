import { Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { AECRepository } from '../../application/ports/AECRepository';
import { AEC } from '../../domain/aec/AEC';
import { AECMapper, AECDocument } from './mappers/AECMapper';
import { AECNotFoundError } from '../../../shared/domain/exceptions/DomainExceptions';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

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
    const docRef = firestore
      .collection('workspaces')
      .doc(aec.workspaceId)
      .collection('aecs')
      .doc(aec.id);

    await docRef.set(doc);
  }

  async findById(id: string): Promise<AEC | null> {
    const firestore = this.getFirestore();
    // Note: This simplified implementation doesn't enforce workspace isolation
    // In production, workspaceId should be passed as parameter
    const snapshot = await firestore
      .collectionGroup('aecs')
      .where('id', '==', id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0].data() as AECDocument;
    return AECMapper.toDomain(doc);
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

    await docRef.update(doc as any);
  }
}
