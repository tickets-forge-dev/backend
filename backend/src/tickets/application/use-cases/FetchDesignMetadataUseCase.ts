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
   *
   * @param reference DesignReference with URL
   * @param workspaceId Workspace to look up OAuth token
   * @returns Updated reference with metadata, or original if fetch fails
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

      // No metadata available for other platforms
      return reference;
    } catch (error) {
      // Log error but don't throw - design link should still be stored
      this.logger.error(
        `Failed to fetch metadata for design reference ${reference.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return reference;
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
      return reference;
    }

    try {
      // Extract Figma file key from URL
      const fileKey = extractFigmaFileKey(reference.url);
      if (!fileKey) {
        this.logger.warn(
          `Could not extract Figma file key from ${reference.url}`,
        );
        return reference;
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
      };

      this.logger.debug(`Fetched Figma metadata for ${reference.url}`);
      return updated;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch Figma metadata for ${reference.url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      // Return reference without metadata
      return reference;
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
      return reference;
    }

    try {
      // Extract Loom shared ID from URL
      const sharedId = extractLoomSharedId(reference.url);
      if (!sharedId) {
        this.logger.warn(
          `Could not extract Loom shared ID from ${reference.url}`,
        );
        return reference;
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
      };

      this.logger.debug(`Fetched Loom metadata for ${reference.url}`);
      return updated;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch Loom metadata for ${reference.url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      // Return reference without metadata
      return reference;
    }
  }
}
