import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { Tag, TagScope, TagColor } from '../../domain/Tag';
import { TagRepository } from '../../application/ports/TagRepository';

interface TagDocument {
  id: string;
  teamId: string;
  name: string;
  color: string;
  scope?: string;
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * FirestoreTagRepository
 *
 * Persists Tags to Firestore subcollection: /teams/{teamId}/tags/{tagId}
 * Team-scoped: all queries filter by teamId via collection path.
 */
@Injectable()
export class FirestoreTagRepository implements TagRepository {
  constructor(private readonly firestore: Firestore) {}

  async save(tag: Tag): Promise<void> {
    const data = tag.toObject();

    await this.firestore
      .collection('teams')
      .doc(tag.getTeamId())
      .collection('tags')
      .doc(tag.getId())
      .set({
        id: data.id,
        teamId: data.teamId,
        name: data.name,
        color: data.color,
        scope: data.scope,
        createdBy: data.createdBy,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      });
  }

  async findByIdInTeam(tagId: string, teamId: string): Promise<Tag | null> {
    const snap = await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('tags')
      .doc(tagId)
      .get();

    if (!snap.exists) return null;
    return this.mapToTag(snap.data() as TagDocument);
  }

  async findByTeam(teamId: string): Promise<Tag[]> {
    const snapshot = await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('tags')
      .get();

    return snapshot.docs.map((doc) => this.mapToTag(doc.data() as TagDocument));
  }

  async findByTeamNameAndScope(
    teamId: string,
    name: string,
    scope: TagScope,
    createdBy?: string,
  ): Promise<Tag | null> {
    // Query by name only (catches pre-migration tags without scope field)
    const snapshot = await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('tags')
      .where('name', '==', name)
      .get();

    if (snapshot.empty) return null;

    // Filter in-memory by scope (treating missing scope as 'team')
    for (const doc of snapshot.docs) {
      const data = doc.data() as TagDocument;
      const tagScope = data.scope || 'team'; // null-coalesce for pre-migration
      if (scope === 'team' && tagScope === 'team') {
        return this.mapToTag(data);
      }
      if (scope === 'private' && tagScope === 'private' && createdBy && data.createdBy === createdBy) {
        return this.mapToTag(data);
      }
    }
    return null;
  }

  async update(tag: Tag): Promise<void> {
    const docRef = this.firestore
      .collection('teams')
      .doc(tag.getTeamId())
      .collection('tags')
      .doc(tag.getId());

    const exists = await docRef.get();
    if (!exists.exists) {
      throw new Error(`Tag ${tag.getId()} not found`);
    }

    await docRef.update({
      name: tag.getName(),
      color: tag.getColor(),
      scope: tag.getScope(),
      updatedAt: new Date(),
    });
  }

  async delete(tagId: string, teamId: string): Promise<void> {
    await this.firestore
      .collection('teams')
      .doc(teamId)
      .collection('tags')
      .doc(tagId)
      .delete();
  }

  private toDate(val: Timestamp | Date | any): Date {
    if (val instanceof Date) return val;
    if (val && typeof val.toDate === 'function') return val.toDate();
    if (val && val._seconds !== undefined) return new Date(val._seconds * 1000);
    return new Date(val);
  }

  private mapToTag(data: TagDocument): Tag {
    return Tag.reconstitute(
      data.id,
      data.teamId,
      data.name,
      (data.color as TagColor) ?? 'blue',
      (data.scope as TagScope) ?? 'team',
      data.createdBy,
      this.toDate(data.createdAt),
      this.toDate(data.updatedAt),
    );
  }
}
