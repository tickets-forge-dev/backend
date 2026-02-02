/**
 * Firestore Index Repository Implementation
 * 
 * Implements IndexRepository port using Firestore.
 * Collection structure: /workspaces/{workspaceId}/indexes/{indexId}
 * 
 * Part of: Story 4.2 - Task 4 (Infrastructure)
 * Layer: Infrastructure
 */

import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { Index, IndexStatus } from '../../domain/Index';
import { IndexRepository } from '../../domain/IndexRepository';
import { FileMetadata } from '../../domain/FileMetadata';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

@Injectable()
export class FirestoreIndexRepository implements IndexRepository {
  private readonly logger = new Logger(FirestoreIndexRepository.name);
  private readonly collection = 'indexes';
  private readonly firestore: Firestore;

  constructor(private readonly firebaseService: FirebaseService) {
    this.firestore = this.firebaseService.getFirestore();
  }

  async save(index: Index): Promise<void> {
    const docRef = this.firestore
      .collection('workspaces')
      .doc(index.workspaceId)
      .collection(this.collection)
      .doc(index.id);

    const data = {
      id: index.id,
      workspaceId: index.workspaceId,
      repositoryId: index.repositoryId,
      repositoryName: index.repositoryName,
      commitSha: index.commitSha,
      status: index.status,
      filesIndexed: index.filesIndexed,
      totalFiles: index.totalFiles,
      filesSkipped: index.filesSkipped,
      parseErrors: index.parseErrors,
      createdAt: index.createdAt,
      completedAt: index.completedAt,
      indexDurationMs: index.indexDurationMs,
      repoSizeMB: index.repoSizeMB,
      errorDetails: index.errorDetails,
      files: index.files.map((f) => ({
        path: f.path,
        language: f.language,
        size: f.size,
        exports: f.exports,
        imports: f.imports,
        functions: f.functions,
        classes: f.classes,
        summary: f.summary,
        loc: f.loc,
        parseWarnings: f.parseWarnings,
      })),
    };

    await docRef.set(data);

    this.logger.log(
      `Saved index ${index.id} for workspace ${index.workspaceId} (${index.filesIndexed} files)`,
    );
  }

  async findById(indexId: string): Promise<Index | null> {
    // For MVP: We know the workspaceId from the indexId pattern or can add metadata
    // For now, we'll need to pass workspaceId or iterate (not ideal but works for MVP)
    // TODO: Add a top-level indexes collection with workspaceId for efficient lookup
    
    // For testing: Try ws_placeholder first
    const testWorkspaces = ['ws_placeholder']; // TODO: Get from config or metadata collection
    
    for (const workspaceId of testWorkspaces) {
      const docRef = this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection(this.collection)
        .doc(indexId);
        
      const doc = await docRef.get();
      if (doc.exists) {
        return this.mapToIndex(doc.data());
      }
    }
    
    return null;
  }

  async findByWorkspaceAndRepo(
    workspaceId: string,
    repoId: number,
  ): Promise<Index[]> {
    const snapshot = await this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection(this.collection)
      .where('repositoryId', '==', repoId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => this.mapToIndex(doc.data()));
  }

  async findByWorkspace(workspaceId: string): Promise<Index[]> {
    const snapshot = await this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection(this.collection)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => this.mapToIndex(doc.data()));
  }

  async findLatestByRepo(
    workspaceId: string,
    repoId: number,
  ): Promise<Index | null> {
    const snapshot = await this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection(this.collection)
      .where('repositoryId', '==', repoId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return this.mapToIndex(snapshot.docs[0].data());
  }

  async updateProgress(
    indexId: string,
    filesIndexed: number,
    totalFiles: number,
  ): Promise<void> {
    // For MVP: Use known workspace
    const workspaceId = 'ws_placeholder'; // TODO: Get from context
    
    const docRef = this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection(this.collection)
      .doc(indexId);

    await docRef.update({
      filesIndexed,
      totalFiles,
    });
  }

  async delete(indexId: string): Promise<void> {
    // For MVP: Use known workspace
    const workspaceId = 'ws_placeholder'; // TODO: Get from context
    
    const docRef = this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection(this.collection)
      .doc(indexId);

    await docRef.delete();
    this.logger.log(`Deleted index ${indexId}`);
  }

  async countByWorkspace(workspaceId: string): Promise<number> {
    const snapshot = await this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection(this.collection)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Map Firestore document to Index domain entity
   */
  private mapToIndex(data: any): Index {
    return new Index(
      data.id,
      data.workspaceId,
      data.repositoryId,
      data.repositoryName,
      data.commitSha,
      data.status as IndexStatus,
      data.filesIndexed,
      data.totalFiles,
      data.filesSkipped || 0,
      data.parseErrors || 0,
      data.createdAt?.toDate() || new Date(),
      data.completedAt?.toDate() || null,
      data.indexDurationMs || 0,
      data.repoSizeMB || 0,
      data.errorDetails || null,
      (data.files || []).map((f: any) => FileMetadata.create(f)),
    );
  }
}
