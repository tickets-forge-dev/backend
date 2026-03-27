import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { Organization, OrganizationType } from '../../domain/Organization';
import { OrganizationId } from '../../domain/OrganizationId';
import { OrganizationRepository } from '../../application/ports/OrganizationRepository';

/**
 * OrganizationRepository - Firestore Implementation
 *
 * Persists Organizations to Firestore collection: /organizations
 * Provides CRUD operations with proper error handling.
 */
@Injectable()
export class FirestoreOrganizationRepository implements OrganizationRepository {
  private readonly COLLECTION_NAME = 'organizations';

  constructor(private firestore: Firestore) {}

  /**
   * Save an organization (create or update)
   */
  async save(org: Organization): Promise<void> {
    const orgObj = org.toObject();

    await this.firestore.collection(this.COLLECTION_NAME).doc(orgObj.id).set({
      id: orgObj.id,
      name: orgObj.name,
      slug: orgObj.slug,
      ownerId: orgObj.ownerId,
      type: orgObj.type,
      createdAt: new Date(orgObj.createdAt),
      updatedAt: new Date(orgObj.updatedAt),
    });
  }

  /**
   * Get organization by ID
   */
  async getById(id: string): Promise<Organization | null> {
    const doc = await this.firestore
      .collection(this.COLLECTION_NAME)
      .doc(id)
      .get();

    if (!doc.exists) {
      return null;
    }

    return this.mapToOrganization(doc.data());
  }

  /**
   * Get all organizations owned by a user
   */
  async getByOwnerId(userId: string): Promise<Organization[]> {
    const docs = await this.firestore
      .collection(this.COLLECTION_NAME)
      .where('ownerId', '==', userId)
      .get();

    return docs.docs.map((doc) => this.mapToOrganization(doc.data()));
  }

  /**
   * Get the personal organization for a user
   */
  async getPersonalOrg(userId: string): Promise<Organization | null> {
    const docs = await this.firestore
      .collection(this.COLLECTION_NAME)
      .where('ownerId', '==', userId)
      .where('type', '==', 'personal')
      .limit(1)
      .get();

    if (docs.empty) {
      return null;
    }

    return this.mapToOrganization(docs.docs[0].data());
  }

  /**
   * Map Firestore document to Organization domain entity
   */
  private mapToOrganization(data: any): Organization {
    if (!data) {
      throw new Error('Cannot map null data to Organization');
    }

    try {
      // Convert Firestore Timestamp objects to JavaScript Dates
      const createdAt = data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt;
      const updatedAt = data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt;

      return Organization.reconstitute(
        OrganizationId.create(data.id),
        data.name,
        data.slug,
        data.ownerId,
        data.type as OrganizationType,
        createdAt,
        updatedAt,
      );
    } catch (error) {
      throw new Error(`Failed to map Firestore data to Organization: ${error}`);
    }
  }
}
