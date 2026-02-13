import { Injectable, Logger } from '@nestjs/common';
import { LoomMetadata, LoomVideo } from './loom.types';

/**
 * LoomService - Handles Loom API calls
 * Fetches video metadata, thumbnails, and duration info
 */
@Injectable()
export class LoomService {
  private readonly logger = new Logger(LoomService.name);
  private readonly API_BASE_URL = 'https://www.loom.com/api/campaigns';

  /**
   * Fetch Loom video metadata by video/shared ID
   * Requires valid Loom access token
   *
   * @param videoId Loom video ID or shared ID
   * @param accessToken Loom OAuth access token
   * @returns LoomMetadata with video info and thumbnail
   * @throws Error if API call fails or token is invalid
   */
  async getVideoMetadata(
    videoId: string,
    accessToken: string,
  ): Promise<LoomMetadata> {
    try {
      // Loom API endpoint for getting video details
      const response = await fetch(`${this.API_BASE_URL}/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        this.logger.warn(
          `Loom rate limit hit for videoId ${videoId}, retry after ${retryAfter}s`,
        );
        throw new Error(
          `Loom API rate limit exceeded. Retry after ${retryAfter} seconds.`,
        );
      }

      // Handle auth failures
      if (response.status === 401 || response.status === 403) {
        this.logger.error(
          `Loom authentication failed for videoId ${videoId}: ${response.status}`,
        );
        throw new Error('Loom access token is invalid or expired');
      }

      // Handle video not found
      if (response.status === 404) {
        this.logger.error(`Loom video not found: ${videoId}`);
        throw new Error(`Loom video not found: ${videoId}`);
      }

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `Loom API error for ${videoId}: ${response.status} - ${error}`,
        );
        throw new Error(`Loom API error: ${response.status}`);
      }

      const data = (await response.json()) as LoomVideo;

      return {
        videoId,
        videoTitle: data.name,
        duration: data.duration,
        thumbnailUrl: data.thumbnail_url,
        lastModified: new Date(data.updated_at),
      };
    } catch (error) {
      // Log and re-throw with context
      this.logger.error(
        `Failed to fetch Loom metadata for ${videoId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Verify that a Loom access token is valid
   * Used during OAuth callback to test token before storing
   *
   * @param accessToken Loom OAuth access token
   * @returns true if token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      return response.status === 200;
    } catch (error) {
      this.logger.error(
        `Failed to verify Loom token: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  /**
   * Format video duration for display
   * @param seconds Duration in seconds
   * @returns Formatted string like "3:45"
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
