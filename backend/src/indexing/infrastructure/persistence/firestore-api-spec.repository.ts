/**
 * Firestore ApiSpec Repository Implementation
 * Persistence layer for ApiSpec entities
 * 
 * Part of: Story 4.3 - OpenAPI Spec Sync
 * Layer: Infrastructure
 */

import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { ApiSpecRepository } from '../../domain/ApiSpecRepository';
import { ApiSpec } from '../../domain/entities/ApiSpec';

@Injectable()
export class FirestoreApiSpecRepository implements ApiSpecRepository {
  private readonly logger = new Logger(FirestoreApiSpecRepository.name);
  private readonly firestore: Firestore;

  constructor() {
    this.firestore = new Firestore();
  }

  async save(apiSpec: ApiSpec): Promise<void> {
    const docRef = this.firestore
      .collection('workspaces')
      .doc(apiSpec.workspaceId)
      .collection('apiSpecs')
      .doc(apiSpec.id);

    await docRef.set({
      repoName: apiSpec.repoName,
      specUrl: apiSpec.specUrl,
      hash: apiSpec.hash,
      endpoints: apiSpec.endpoints,
      version: apiSpec.version,
      commitSha: apiSpec.commitSha,
      hasSpec: apiSpec.hasSpec,
      isValid: apiSpec.isValid,
      validationErrors: apiSpec.validationErrors || null,
      createdAt: apiSpec.createdAt,
      updatedAt: apiSpec.updatedAt,
    });

    this.logger.log(`Saved API spec: ${apiSpec.id} for ${apiSpec.repoName}`);
  }

  async findByRepo(
    workspaceId: string,
    repoName: string,
  ): Promise<ApiSpec | null> {
    const snapshot = await this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection('apiSpecs')
      .where('repoName', '==', repoName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return this.mapToApiSpec(doc.id, workspaceId, doc.data());
  }

  async findById(specId: string): Promise<ApiSpec | null> {
    const workspacesSnapshot = await this.firestore
      .collection('workspaces')
      .get();

    for (const workspaceDoc of workspacesSnapshot.docs) {
      const specDoc = await workspaceDoc.ref
        .collection('apiSpecs')
        .doc(specId)
        .get();

      if (specDoc.exists) {
        return this.mapToApiSpec(
          specId,
          workspaceDoc.id,
          specDoc.data()!,
        );
      }
    }

    return null;
  }

  async update(specId: string, updates: Partial<ApiSpec>): Promise<void> {
    const workspacesSnapshot = await this.firestore
      .collection('workspaces')
      .get();

    for (const workspaceDoc of workspacesSnapshot.docs) {
      const specRef = workspaceDoc.ref.collection('apiSpecs').doc(specId);
      const specDoc = await specRef.get();

      if (specDoc.exists) {
        await specRef.update({
          ...updates,
          updatedAt: new Date(),
        });
        
        this.logger.log(`Updated API spec: ${specId}`);
        return;
      }
    }

    throw new Error(`API spec not found: ${specId}`);
  }

  private mapToApiSpec(
    id: string,
    workspaceId: string,
    data: FirebaseFirestore.DocumentData,
  ): ApiSpec {
    return {
      id,
      workspaceId,
      repoName: data.repoName,
      specUrl: data.specUrl,
      hash: data.hash,
      endpoints: data.endpoints || [],
      version: data.version,
      commitSha: data.commitSha,
      hasSpec: data.hasSpec,
      isValid: data.isValid,
      validationErrors: data.validationErrors || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }
}
