import { Injectable, Logger } from '@nestjs/common';
import { FigmaFile, FigmaMetadata } from './figma.types';

/**
 * FigmaService - Handles Figma REST API calls
 * Fetches file metadata, thumbnails, and other design context
 */
@Injectable()
export class FigmaService {
  private readonly logger = new Logger(FigmaService.name);
  private readonly API_BASE_URL = 'https://api.figma.com/v1';

  /**
   * Fetch Figma file metadata by file key
   * Requires valid Figma access token
   *
   * @param fileKey Figma file key (extracted from URL)
   * @param accessToken Figma OAuth access token
   * @returns FigmaMetadata with file info and thumbnail
   * @throws Error if API call fails or token is invalid
   */
  async getFileMetadata(
    fileKey: string,
    accessToken: string,
  ): Promise<FigmaMetadata> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/files/${fileKey}`, {
        method: 'GET',
        headers: {
          'X-Figma-Token': accessToken,
        },
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        this.logger.warn(
          `Figma rate limit hit for fileKey ${fileKey}, retry after ${retryAfter}s`,
        );
        throw new Error(
          `Figma API rate limit exceeded. Retry after ${retryAfter} seconds.`,
        );
      }

      // Handle auth failures
      if (response.status === 401 || response.status === 403) {
        this.logger.error(
          `Figma authentication failed for fileKey ${fileKey}: ${response.status}`,
        );
        throw new Error('Figma access token is invalid or expired');
      }

      // Handle file not found
      if (response.status === 404) {
        this.logger.error(`Figma file not found: ${fileKey}`);
        throw new Error(`Figma file not found: ${fileKey}`);
      }

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `Figma API error for ${fileKey}: ${response.status} - ${error}`,
        );
        throw new Error(`Figma API error: ${response.status}`);
      }

      const data = (await response.json()) as FigmaFile;

      return {
        fileKey,
        fileName: data.name,
        thumbnailUrl: data.thumbnailUrl,
        lastModified: new Date(data.lastModified),
      };
    } catch (error) {
      // Log and re-throw with context
      this.logger.error(
        `Failed to fetch Figma metadata for ${fileKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Verify that a Figma access token is valid
   * Used during OAuth callback to test token before storing
   *
   * @param accessToken Figma OAuth access token
   * @returns true if token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'X-Figma-Token': accessToken,
        },
      });

      return response.status === 200;
    } catch (error) {
      this.logger.error(
        `Failed to verify Figma token: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
