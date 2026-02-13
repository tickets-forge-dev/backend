import { Injectable, Logger } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import { LoomOAuthToken } from './loom.types';

/**
 * LoomIntegrationRepository - Manages Loom OAuth tokens at workspace level
 * Stores encrypted access tokens for workspace-level Loom API access
 */
@Injectable()
export class LoomIntegrationRepository {
  private readonly logger = new Logger(LoomIntegrationRepository.name);
  private readonly collection = 'workspaces';
  private readonly subcollection = 'integrations';

  /** Lazy-load Firestore to avoid initialization errors */
  private get db() {
    return getFirestore();
  }

  /**
   * Get stored Loom OAuth token for workspace
   * @param workspaceId Workspace ID
   * @returns LoomOAuthToken if exists, null otherwise
   */
  async getToken(workspaceId: string): Promise<LoomOAuthToken | null> {
    try {
      const doc = await this.db
        .collection(this.collection)
        .doc(workspaceId)
        .collection(this.subcollection)
        .doc('loom')
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as LoomOAuthToken;
    } catch (error) {
      this.logger.error(
        `Failed to get Loom token for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * Store Loom OAuth token for workspace
   * @param workspaceId Workspace ID
   * @param token LoomOAuthToken to store
   */
  async saveToken(
    workspaceId: string,
    token: LoomOAuthToken,
  ): Promise<void> {
    try {
      await this.db
        .collection(this.collection)
        .doc(workspaceId)
        .collection(this.subcollection)
        .doc('loom')
        .set(token, { merge: true });

      this.logger.debug(`Saved Loom token for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to save Loom token for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Delete stored Loom OAuth token
   * @param workspaceId Workspace ID
   */
  async deleteToken(workspaceId: string): Promise<void> {
    try {
      await this.db
        .collection(this.collection)
        .doc(workspaceId)
        .collection(this.subcollection)
        .doc('loom')
        .delete();

      this.logger.debug(`Deleted Loom token for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete Loom token for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Check if Loom is connected for workspace
   * @param workspaceId Workspace ID
   * @returns true if token exists
   */
  async isConnected(workspaceId: string): Promise<boolean> {
    const token = await this.getToken(workspaceId);
    return !!token;
  }
}
