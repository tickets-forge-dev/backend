import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { Folder } from '../../domain/Folder';
import { FolderRepository } from '../../application/ports/FolderRepository';

interface FolderDocument {
  id: string;
  teamId: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * FirestoreFolderRepository
 *
 * Persists Folders to Firestore subcollection: /teams/{teamId}/folders/{folderId}
 * Team-scoped: all queries filter by teamId via collection path.
 */
@Injectable()
export class FirestoreFolderRepository implements FolderRepository {
  constructor(private readonly firestore: Firestore) {}

  async save(folder: Folder): Promise<void> {
    const data = folder.toObject();

    await this.firestore
      .collection('teams')
      .doc(folder.getTeamId())
      .collection('folders')
      .doc(folder.getId())
      .set({
        id: data.id,
        teamId: data.teamId,
        name: data.name,
        createdBy: data.createdBy,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      });
  }

  async findByIdInTeam(folderId: string, teamId: string): Promise<Folder | null> {
    const snap = await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('folders')
      .doc(folderId)
      .get();

    if (!snap.exists) return null;
    return this.mapToFolder(snap.data() as FolderDocument);
  }

  async findByTeam(teamId: string): Promise<Folder[]> {
    const snapshot = await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('folders')
      .orderBy('name', 'asc')
      .get();

    return snapshot.docs.map((doc) => this.mapToFolder(doc.data() as FolderDocument));
  }

  async findByTeamAndName(teamId: string, name: string): Promise<Folder | null> {
    const snapshot = await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('folders')
      .where('name', '==', name)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.mapToFolder(snapshot.docs[0].data() as FolderDocument);
  }

  async update(folder: Folder): Promise<void> {
    const docRef = this.firestore
      .collection('teams')
      .doc(folder.getTeamId())
      .collection('folders')
      .doc(folder.getId());

    const exists = await docRef.get();
    if (!exists.exists) {
      throw new Error(`Folder ${folder.getId()} not found`);
    }

    await docRef.update({
      name: folder.getName(),
      updatedAt: new Date(),
    });
  }

  async delete(folderId: string, teamId: string): Promise<void> {
    await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('folders')
      .doc(folderId)
      .delete();
  }

  async countByTeam(teamId: string): Promise<number> {
    const snapshot = await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('folders')
      .count()
      .get();
    return snapshot.data().count;
  }

  private mapToFolder(data: FolderDocument): Folder {
    const createdAt = data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : data.createdAt;
    const updatedAt = data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate()
      : data.updatedAt;

    return Folder.reconstitute(
      data.id,
      data.teamId,
      data.name,
      data.createdBy,
      createdAt,
      updatedAt,
    );
  }
}
