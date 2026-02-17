import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { Team } from '../../domain/Team';
import { TeamId } from '../../domain/TeamId';
import { TeamSettings } from '../../domain/TeamSettings';
import { TeamFactory } from '../../domain/TeamFactory';
import { InvalidTeamException } from '../../domain/exceptions/InvalidTeamException';

/**
 * TeamRepository - Firestore Implementation
 *
 * Persists Teams to Firestore collection: /teams
 * Provides CRUD operations with proper error handling.
 */
@Injectable()
export class FirestoreTeamRepository {
  private readonly COLLECTION_NAME = 'teams';

  constructor(private firestore: Firestore) {}

  /**
   * Save a team (create or update)
   */
  async save(team: Team): Promise<void> {
    const teamObj = team.toObject();

    await this.firestore.collection(this.COLLECTION_NAME).doc(teamObj.id).set({
      id: teamObj.id,
      name: teamObj.name,
      slug: teamObj.slug,
      ownerId: teamObj.ownerId,
      settings: teamObj.settings,
      createdAt: new Date(teamObj.createdAt),
      updatedAt: new Date(teamObj.updatedAt),
      isDeleted: false,
    });
  }

  /**
   * Get team by ID
   */
  async getById(teamId: TeamId): Promise<Team | null> {
    const doc = await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(teamId.getValue())
      .get();

    if (!doc.exists) {
      return null;
    }

    return this.mapToTeam(doc.data());
  }

  /**
   * Get team by slug (unique)
   */
  async getBySlug(slug: string): Promise<Team | null> {
    const docs = await this.firestore
      .collection(this.COLLECTION_NAME)
      .where('slug', '==', slug)
      .where('isDeleted', '==', false)
      .limit(1)
      .get();

    if (docs.empty) {
      return null;
    }

    return this.mapToTeam(docs.docs[0].data());
  }

  /**
   * Get all teams for a user
   */
  async getByOwnerId(ownerId: string): Promise<Team[]> {
    const docs = await this.firestore
      .collection(this.COLLECTION_NAME)
      .where('ownerId', '==', ownerId)
      .where('isDeleted', '==', false)
      .get();

    return docs.docs.map((doc) => this.mapToTeam(doc.data()));
  }

  /**
   * Update team
   */
  async update(team: Team): Promise<void> {
    const teamObj = team.toObject();

    const existingDoc = await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(teamObj.id)
      .get();

    if (!existingDoc.exists) {
      throw new Error(`Team ${teamObj.id} not found`);
    }

    await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(teamObj.id)
      .update({
        name: teamObj.name,
        slug: teamObj.slug,
        settings: teamObj.settings,
        updatedAt: new Date(teamObj.updatedAt),
      });
  }

  /**
   * Delete team (soft delete)
   */
  async delete(teamId: TeamId): Promise<void> {
    await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(teamId.getValue())
      .update({
        isDeleted: true,
        updatedAt: new Date(),
      });
  }

  /**
   * Check if slug is unique
   */
  async isSlugUnique(slug: string, excludeTeamId?: string): Promise<boolean> {
    const docs = await this.firestore
      .collection(this.COLLECTION_NAME)
      .where('slug', '==', slug)
      .where('isDeleted', '==', false)
      .get();

    if (docs.empty) {
      return true;
    }

    if (excludeTeamId && docs.size === 1) {
      return docs.docs[0].id === excludeTeamId;
    }

    return false;
  }

  /**
   * Map Firestore document to Team domain entity
   */
  private mapToTeam(data: any): Team {
    if (!data) {
      throw new Error('Cannot map null data to Team');
    }

    try {
      const settings = TeamSettings.create(
        data.settings?.defaultWorkspaceId,
        data.settings?.allowMemberInvites ?? true,
      );

      return TeamFactory.fromPersistence({
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.ownerId,
        settings: settings.toObject(),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    } catch (error) {
      throw new Error(`Failed to map Firestore data to Team: ${error}`);
    }
  }
}
