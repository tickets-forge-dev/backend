/**
 * Firestore GitHub Integration Repository
 * 
 * Persistence adapter for GitHubIntegration entity.
 * Implements the repository port defined in domain layer.
 * 
 * Part of: Story 4.1 - GitHub App Integration
 * Layer: Infrastructure (adapter for Firestore)
 * 
 * Firestore Path: /workspaces/{workspaceId}/integrations/github
 */

import { Injectable, Logger } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { GitHubIntegration, GitHubIntegrationProps } from '../../domain/GitHubIntegration';
import { GitHubIntegrationRepository } from '../../domain/GitHubIntegrationRepository';
import { GitHubRepository, GitHubRepositoryProps } from '../../domain/GitHubRepository';

interface GitHubIntegrationDocument {
  id: string;
  workspaceId: string;
  installationId: number;
  accountLogin: string;
  accountType: 'User' | 'Organization';
  encryptedAccessToken: string;
  selectedRepositories: GitHubRepositoryProps[];
  connectedAt: Timestamp;
  updatedAt: Timestamp;
}

@Injectable()
export class FirestoreGitHubIntegrationRepository implements GitHubIntegrationRepository {
  private readonly logger = new Logger(FirestoreGitHubIntegrationRepository.name);
  private readonly collectionPath = 'workspaces';

  constructor(private readonly firestore: Firestore) {}

  /**
   * Find integration by workspace ID
   * AC#3: Retrieve stored integration
   */
  async findByWorkspaceId(workspaceId: string): Promise<GitHubIntegration | null> {
    try {
      const integrationDoc = await this.firestore
        .collection(this.collectionPath)
        .doc(workspaceId)
        .collection('integrations')
        .doc('github')
        .get();

      if (!integrationDoc.exists) {
        return null;
      }

      const data = integrationDoc.data() as GitHubIntegrationDocument;
      return this.toDomain(data);
    } catch (error: any) {
      this.logger.error(`Failed to find integration for workspace ${workspaceId}:`, error.message);
      throw new Error(`Failed to retrieve GitHub integration: ${error.message}`);
    }
  }

  /**
   * Find integration by ID
   */
  async findById(id: string): Promise<GitHubIntegration | null> {
    try {
      // Query across all workspaces to find by ID
      const snapshot = await this.firestore
        .collectionGroup('integrations')
        .where('id', '==', id)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as GitHubIntegrationDocument;
      return this.toDomain(data);
    } catch (error: any) {
      this.logger.error(`Failed to find integration by ID ${id}:`, error.message);
      throw new Error(`Failed to retrieve GitHub integration: ${error.message}`);
    }
  }

  /**
   * Save or update integration
   * AC#3: Store integration with encrypted token
   */
  async save(integration: GitHubIntegration): Promise<void> {
    try {
      const data = this.toDocument(integration);
      
      await this.firestore
        .collection(this.collectionPath)
        .doc(integration.workspaceId)
        .collection('integrations')
        .doc('github')
        .set(data, { merge: true });

      this.logger.log(`Saved GitHub integration for workspace ${integration.workspaceId}`);
    } catch (error: any) {
      this.logger.error(`Failed to save integration for workspace ${integration.workspaceId}:`, error.message);
      throw new Error(`Failed to save GitHub integration: ${error.message}`);
    }
  }

  /**
   * Delete integration by workspace ID (optimized)
   */
  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    try {
      await this.firestore
        .collection(this.collectionPath)
        .doc(workspaceId)
        .collection('integrations')
        .doc('github')
        .delete();

      this.logger.log(`Deleted GitHub integration from workspace ${workspaceId}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete integration for workspace ${workspaceId}:`, error.message);
      throw new Error(`Failed to delete GitHub integration: ${error.message}`);
    }
  }

  /**
   * Delete integration
   * AC#7: Disconnect and remove integration
   */
  async delete(id: string): Promise<void> {
    try {
      // Find the integration first to get workspace ID
      const integration = await this.findById(id);
      
      if (!integration) {
        this.logger.warn(`Attempted to delete non-existent integration ${id}`);
        return;
      }

      await this.deleteByWorkspaceId(integration.workspaceId);
    } catch (error: any) {
      this.logger.error(`Failed to delete integration ${id}:`, error.message);
      throw new Error(`Failed to delete GitHub integration: ${error.message}`);
    }
  }

  /**
   * Check if workspace has integration
   */
  async existsByWorkspaceId(workspaceId: string): Promise<boolean> {
    try {
      const integration = await this.findByWorkspaceId(workspaceId);
      return integration !== null;
    } catch (error: any) {
      this.logger.error(`Failed to check integration existence for workspace ${workspaceId}:`, error.message);
      return false;
    }
  }

  /**
   * Map domain entity to Firestore document
   */
  private toDocument(integration: GitHubIntegration): GitHubIntegrationDocument {
    const props = integration.toObject();

    return {
      id: props.id,
      workspaceId: props.workspaceId,
      installationId: props.installationId,
      accountLogin: props.accountLogin,
      accountType: props.accountType,
      encryptedAccessToken: props.encryptedAccessToken,
      selectedRepositories: props.selectedRepositories.map((repo) => repo.toObject()),
      connectedAt: Timestamp.fromDate(props.connectedAt),
      updatedAt: Timestamp.fromDate(props.updatedAt),
    };
  }

  /**
   * Map Firestore document to domain entity
   */
  private toDomain(doc: GitHubIntegrationDocument): GitHubIntegration {
    const props: GitHubIntegrationProps = {
      id: doc.id,
      workspaceId: doc.workspaceId,
      installationId: doc.installationId,
      accountLogin: doc.accountLogin,
      accountType: doc.accountType,
      encryptedAccessToken: doc.encryptedAccessToken,
      selectedRepositories: doc.selectedRepositories.map((repoProps) =>
        GitHubRepository.create(repoProps)
      ),
      connectedAt: doc.connectedAt.toDate(),
      updatedAt: doc.updatedAt.toDate(),
    };

    return GitHubIntegration.reconstitute(props);
  }
}
