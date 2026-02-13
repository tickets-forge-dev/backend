import { Injectable, Logger } from '@nestjs/common';
import {
  DesignReference,
  extractFigmaFileKey,
  extractLoomSharedId,
} from '../../domain/value-objects/DesignReference';
import { FigmaService } from '../../../integrations/figma/figma.service';
import { LoomService } from '../../../integrations/loom/loom.service';
import { FigmaIntegrationRepository } from '../../../integrations/figma/figma-integration.repository';
import { LoomIntegrationRepository } from '../../../integrations/loom/loom-integration.repository';

/**
 * FetchDesignMetadataUseCase - Fetch metadata for design references
 * Asynchronously enriches design references with thumbnails, titles, etc.
 * Non-blocking: failures don't prevent design link from being stored
 */
@Injectable()
export class FetchDesignMetadataUseCase {
  private readonly logger = new Logger(FetchDesignMetadataUseCase.name);

  constructor(
    private readonly figmaService: FigmaService,
    private readonly loomService: LoomService,
    private readonly figmaIntegrationRepository: FigmaIntegrationRepository,
    private readonly loomIntegrationRepository: LoomIntegrationRepository,
  ) {}

  /**
   * Fetch and return metadata for design reference
   * Returns null/undefined metadata if API unavailable or not connected
   * Tracks fetch status for error handling
   *
   * @param reference DesignReference with URL
   * @param workspaceId Workspace to look up OAuth token
   * @returns Updated reference with metadata and fetch status
   */
  async execute(
    reference: DesignReference,
    workspaceId: string,
  ): Promise<DesignReference> {
    try {
      // Route to appropriate metadata fetcher
      if (reference.platform === 'figma') {
        return await this.fetchFigmaMetadata(reference, workspaceId);
      } else if (reference.platform === 'loom') {
        return await this.fetchLoomMetadata(reference, workspaceId);
      }

      // No metadata available for other platforms - mark as skipped
      return {
        ...reference,
        metadataFetchStatus: 'pending', // Not attempting to fetch for unsupported platforms
      };
    } catch (error) {
      // Log error but don't throw - design link should still be stored
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch metadata for design reference ${reference.id}: ${errorMessage}`,
      );
      return {
        ...reference,
        metadataFetchStatus: 'failed',
        metadataFetchError: errorMessage,
      };
    }
  }

  /**
   * Fetch Figma file metadata
   * @private
   */
  private async fetchFigmaMetadata(
    reference: DesignReference,
    workspaceId: string,
  ): Promise<DesignReference> {
    // Check if Figma is connected for this workspace
    const token = await this.figmaIntegrationRepository.getToken(workspaceId);
    if (!token) {
      this.logger.debug(
        `Figma not connected for workspace ${workspaceId}, skipping metadata fetch`,
      );
      // Figma not connected - can retry later
      return {
        ...reference,
        metadataFetchStatus: 'pending',
      };
    }

    try {
      // Extract Figma file key from URL
      const fileKey = extractFigmaFileKey(reference.url);
      if (!fileKey) {
        const error = `Could not extract Figma file key from ${reference.url}`;
        this.logger.warn(error);
        return {
          ...reference,
          metadataFetchStatus: 'failed',
          metadataFetchError: error,
        };
      }

      // Fetch metadata from Figma API
      const metadata = await this.figmaService.getFileMetadata(
        fileKey,
        token.accessToken,
      );

      // Create new reference with metadata
      const updated: DesignReference = {
        ...reference,
        metadata: {
          figma: {
            fileName: metadata.fileName,
            thumbnailUrl: metadata.thumbnailUrl,
            lastModified: metadata.lastModified,
            fileKey: metadata.fileKey,
          },
        },
        metadataFetchStatus: 'success',
      };

      this.logger.debug(`Fetched Figma metadata for ${reference.url}`);
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to fetch Figma metadata for ${reference.url}: ${errorMessage}`,
      );
      // Return reference with error status
      return {
        ...reference,
        metadataFetchStatus: 'failed',
        metadataFetchError: errorMessage,
      };
    }
  }

  /**
   * Fetch Loom video metadata
   * @private
   */
  private async fetchLoomMetadata(
    reference: DesignReference,
    workspaceId: string,
  ): Promise<DesignReference> {
    // Check if Loom is connected for this workspace
    const token = await this.loomIntegrationRepository.getToken(workspaceId);
    if (!token) {
      this.logger.debug(
        `Loom not connected for workspace ${workspaceId}, skipping metadata fetch`,
      );
      // Loom not connected - can retry later
      return {
        ...reference,
        metadataFetchStatus: 'pending',
      };
    }

    try {
      // Extract Loom shared ID from URL
      const sharedId = extractLoomSharedId(reference.url);
      if (!sharedId) {
        const error = `Could not extract Loom shared ID from ${reference.url}`;
        this.logger.warn(error);
        return {
          ...reference,
          metadataFetchStatus: 'failed',
          metadataFetchError: error,
        };
      }

      // Fetch metadata from Loom API
      const metadata = await this.loomService.getVideoMetadata(
        sharedId,
        token.access_token,
      );

      // Create new reference with metadata
      const updated: DesignReference = {
        ...reference,
        metadata: {
          loom: {
            videoTitle: metadata.videoTitle,
            duration: metadata.duration,
            thumbnailUrl: metadata.thumbnailUrl,
            sharedId: metadata.videoId,
          },
        },
        metadataFetchStatus: 'success',
      };

      this.logger.debug(`Fetched Loom metadata for ${reference.url}`);
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to fetch Loom metadata for ${reference.url}: ${errorMessage}`,
      );
      // Return reference with error status
      return {
        ...reference,
        metadataFetchStatus: 'failed',
        metadataFetchError: errorMessage,
      };
    }
  }
}
