import { Injectable, Logger } from '@nestjs/common';
import { LoomMetadata, LoomVideo } from './loom.types';
import { HttpClientService } from '../../shared/integrations/http-client.service';
import { CircuitBreakerService } from '../../shared/integrations/circuit-breaker.service';

/**
 * LoomService - Handles Loom API calls
 * Fetches video metadata, thumbnails, and duration info
 *
 * Uses shared HttpClientService for connection pooling:
 * - Reuses TCP connections across multiple API calls
 * - ~15-25% faster for repeated video requests
 * - Better resource utilization under load
 *
 * Uses Circuit Breaker pattern for resilience:
 * - Prevents cascading failures when Loom API is down
 * - Automatic recovery testing (HALF_OPEN state)
 * - Fast-fail responses instead of timeouts
 */
@Injectable()
export class LoomService {
  private readonly logger = new Logger(LoomService.name);
  private readonly API_BASE_URL = 'https://www.loom.com/api/campaigns';

  /**
   * Circuit breaker for Loom API calls
   * - Opens after 5 consecutive failures
   * - Attempts recovery after 60 seconds
   * - Succeeds after 2 successful requests in HALF_OPEN state
   */
  private readonly circuitBreaker = new CircuitBreakerService('loom-api', {
    threshold: 5,
    timeout: 60000,
    successThreshold: 2,
    logStateChanges: true,
  });

  constructor(private readonly httpClient: HttpClientService) {}

  /**
   * Fetch Loom video metadata by video/shared ID
   * Requires valid Loom access token
   *
   * Protected by circuit breaker - returns fast if API is down
   *
   * @param videoId Loom video ID or shared ID
   * @param accessToken Loom OAuth access token
   * @returns LoomMetadata with video info and thumbnail
   * @throws Error if API call fails, token is invalid, or circuit is open
   */
  async getVideoMetadata(
    videoId: string,
    accessToken: string,
  ): Promise<LoomMetadata> {
    // Execute with circuit breaker protection
    // If circuit is open, immediately reject instead of making request
    return this.circuitBreaker.execute(() =>
      this._fetchVideoMetadata(videoId, accessToken),
    );
  }

  /**
   * Private: Actual Loom API call (wrapped by circuit breaker)
   */
  private async _fetchVideoMetadata(
    videoId: string,
    accessToken: string,
  ): Promise<LoomMetadata> {
    try {
      // Set 10-second timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        // Loom API endpoint for getting video details
        const response = await this.httpClient.fetch(
          `${this.API_BASE_URL}/${videoId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

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

        // Validate response has required fields
        if (
          !data.name ||
          !data.thumbnail_url ||
          typeof data.duration !== 'number' ||
          !data.updated_at
        ) {
          throw new Error(
            `Invalid Loom API response: missing required fields (name: ${!!data.name}, thumbnail_url: ${!!data.thumbnail_url}, duration: ${typeof data.duration === 'number'}, updated_at: ${!!data.updated_at})`,
          );
        }

        return {
          videoId,
          videoTitle: data.name,
          duration: data.duration,
          thumbnailUrl: data.thumbnail_url,
          lastModified: new Date(data.updated_at),
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      // Distinguish between timeout and other errors
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error(
          `Loom API timeout for videoId ${videoId} (10s exceeded)`,
        );
        throw new Error('Loom API request timeout');
      }

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
   * Protected by circuit breaker - gracefully handles API outages
   *
   * @param accessToken Loom OAuth access token
   * @returns true if token is valid, false if invalid, timeout, or circuit open
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    return this.circuitBreaker
      .execute(() => this._verifyToken(accessToken))
      .catch(() => false); // Fallback to false if circuit open or error
  }

  /**
   * Private: Actual token verification (wrapped by circuit breaker)
   */
  private async _verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.httpClient.fetch(`${this.API_BASE_URL}`, {
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
