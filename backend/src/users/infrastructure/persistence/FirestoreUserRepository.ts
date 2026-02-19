import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { User } from '../../domain/User';
import { UserFactory } from '../../domain/UserFactory';
import { TeamId } from '../../../teams/domain/TeamId';

/**
 * UserRepository - Firestore Implementation
 *
 * Persists Users to Firestore collection: /users
 */
@Injectable()
export class FirestoreUserRepository {
  private readonly COLLECTION_NAME = 'users';

  constructor(private firestore: Firestore) {}

  /**
   * Save a user (create or update)
   */
  async save(user: User): Promise<void> {
    const userObj = user.toObject();

    await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(userObj.userId)
      .set({
        userId: userObj.userId,
        email: userObj.email,
        displayName: userObj.displayName,
        photoURL: userObj.photoURL || null,
        currentTeamId: userObj.currentTeamId,
        teams: userObj.teams,
        createdAt: new Date(userObj.createdAt),
        updatedAt: new Date(userObj.updatedAt),
      });
  }

  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<User | null> {
    const doc = await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(userId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return this.mapToUser(doc.data());
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const docs = await this.firestore
      .collection(this.COLLECTION_NAME)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (docs.empty) {
      return null;
    }

    return this.mapToUser(docs.docs[0].data());
  }

  /**
   * Update user
   */
  async update(user: User): Promise<void> {
    const userObj = user.toObject();

    const existingDoc = await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(userObj.userId)
      .get();

    if (!existingDoc.exists) {
      throw new Error(`User ${userObj.userId} not found`);
    }

    await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(userObj.userId)
      .update({
        displayName: userObj.displayName,
        photoURL: userObj.photoURL || null,
        currentTeamId: userObj.currentTeamId,
        teams: userObj.teams,
        updatedAt: new Date(userObj.updatedAt),
      });
  }

  /**
   * Get all users for a specific team
   */
  async getUsersByTeamId(teamId: TeamId): Promise<User[]> {
    const docs = await this.firestore
      .collection(this.COLLECTION_NAME)
      .where('teams', 'array-contains', teamId.getValue())
      .get();

    return docs.docs.map((doc) => this.mapToUser(doc.data()));
  }

  /**
   * Map Firestore document to User domain entity
   */
  private mapToUser(data: any): User {
    if (!data) {
      throw new Error('Cannot map null data to User');
    }

    try {
      // Convert Firestore Timestamp objects to JavaScript Dates
      const createdAt = data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt;
      const updatedAt = data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt;

      return UserFactory.fromPersistence({
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || undefined,
        currentTeamId: data.currentTeamId || null,
        teams: data.teams || [],
        createdAt: createdAt,
        updatedAt: updatedAt,
      });
    } catch (error) {
      throw new Error(`Failed to map Firestore data to User: ${error}`);
    }
  }
}
