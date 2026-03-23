import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { Folder, FolderScope } from '../../domain/Folder';
import { FolderRepository } from '../../application/ports/FolderRepository';

interface FolderDocument {
  id: string;
  teamId: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  scope?: string;
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
        scope: data.scope,
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

  async findByTeamNameAndScope(
    teamId: string,
    name: string,
    scope: FolderScope,
    createdBy?: string,
  ): Promise<Folder | null> {
    let query = this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('folders')
      .where('name', '==', name)
      .where('scope', '==', scope);

    // For private scope, also filter by creator
    if (scope === 'private' && createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }

    const snapshot = await query.limit(1).get();

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
      scope: folder.getScope(),
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

  private toDate(val: Timestamp | Date | any): Date {
    if (val instanceof Date) return val;
    if (val && typeof val.toDate === 'function') return val.toDate();
    if (val && val._seconds !== undefined) return new Date(val._seconds * 1000);
    return new Date(val);
  }

  private mapToFolder(data: FolderDocument): Folder {
    return Folder.reconstitute(
      data.id,
      data.teamId,
      data.name,
      data.createdBy,
      this.toDate(data.createdAt),
      this.toDate(data.updatedAt),
      (data.scope as FolderScope) ?? 'team',
    );
  }
}
