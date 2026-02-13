import { Injectable, Logger } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import { FigmaOAuthToken } from './figma.types';

/**
 * FigmaIntegrationRepository - Manages Figma OAuth tokens at workspace level
 * Stores encrypted access tokens for workspace-level Figma API access
 */
@Injectable()
export class FigmaIntegrationRepository {
  private readonly logger = new Logger(FigmaIntegrationRepository.name);
  private readonly db = getFirestore();
  private readonly collection = 'workspaces';
  private readonly subcollection = 'integrations';

  /**
   * Get stored Figma OAuth token for workspace
   * @param workspaceId Workspace ID
   * @returns FigmaOAuthToken if exists, null otherwise
   */
  async getToken(workspaceId: string): Promise<FigmaOAuthToken | null> {
    try {
      const doc = await this.db
        .collection(this.collection)
        .doc(workspaceId)
        .collection(this.subcollection)
        .doc('figma')
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as FigmaOAuthToken;
    } catch (error) {
      this.logger.error(
        `Failed to get Figma token for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * Store Figma OAuth token for workspace
   * @param workspaceId Workspace ID
   * @param token FigmaOAuthToken to store
   */
  async saveToken(
    workspaceId: string,
    token: FigmaOAuthToken,
  ): Promise<void> {
    try {
      await this.db
        .collection(this.collection)
        .doc(workspaceId)
        .collection(this.subcollection)
        .doc('figma')
        .set(token, { merge: true });

      this.logger.debug(`Saved Figma token for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to save Figma token for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Delete stored Figma OAuth token
   * @param workspaceId Workspace ID
   */
  async deleteToken(workspaceId: string): Promise<void> {
    try {
      await this.db
        .collection(this.collection)
        .doc(workspaceId)
        .collection(this.subcollection)
        .doc('figma')
        .delete();

      this.logger.debug(`Deleted Figma token for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete Figma token for workspace ${workspaceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Check if Figma is connected for workspace
   * @param workspaceId Workspace ID
   * @returns true if token exists
   */
  async isConnected(workspaceId: string): Promise<boolean> {
    const token = await this.getToken(workspaceId);
    return !!token;
  }
}
