import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';
import { WorkspaceRepository } from '../../application/ports/WorkspaceRepository';
import { Workspace } from '../../domain/Workspace';
import { Timestamp } from 'firebase-admin/firestore';

@Injectable()
export class FirestoreWorkspaceRepository implements WorkspaceRepository {
  private firestore: any = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore() {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore!;
  }

  async save(workspace: Workspace): Promise<void> {
    const firestore = this.getFirestore();

    const doc = {
      id: workspace.id,
      ownerId: workspace.ownerId,
      name: workspace.name,
      createdAt: Timestamp.fromDate(workspace.createdAt),
      updatedAt: Timestamp.fromDate(workspace.updatedAt),
    };

    await firestore.collection('workspaces').doc(workspace.id).set(doc);

    console.log(`✅ Workspace saved: ${workspace.id} (owner: ${workspace.ownerId})`);
  }

  async findById(id: string): Promise<Workspace | null> {
    const firestore = this.getFirestore();

    const snapshot = await firestore.collection('workspaces').doc(id).get();

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data();
    return Workspace.reconstitute(
      data.id,
      data.ownerId,
      data.name,
      data.createdAt.toDate(),
      data.updatedAt.toDate(),
    );
  }

  async findByOwnerId(ownerId: string): Promise<Workspace | null> {
    const firestore = this.getFirestore();

    const snapshot = await firestore
      .collection('workspaces')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data();
    return Workspace.reconstitute(
      data.id,
      data.ownerId,
      data.name,
      data.createdAt.toDate(),
      data.updatedAt.toDate(),
    );
  }
}
