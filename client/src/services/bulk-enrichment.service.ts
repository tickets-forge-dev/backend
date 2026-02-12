/**
 * Bulk Enrichment Service
 *
 * API client for parallel ticket enrichment and finalization.
 * Handles SSE connections for real-time progress streaming.
 */

import { auth } from '@/lib/firebase';

/**
 * Request DTO for bulk enrichment
 */
export interface BulkEnrichDto {
  ticketIds: string[];
  repositoryOwner?: string;
  repositoryName?: string;
  branch?: string;
}

/**
 * Progress event from enrichment SSE stream
 */
export interface EnrichmentProgressEvent {
  type: 'progress' | 'complete' | 'error';
  ticketId?: string;
  ticketTitle?: string;
  agentId?: number;
  phase?: string;
  status?: string;
  message?: string;
  metadata?: any;
  questions?: Record<string, any[]>;
  errors?: Record<string, string>;
  completedCount?: number;
  failedCount?: number;
}

/**
 * Bulk Enrichment Service
 */
export class BulkEnrichmentService {
  private apiUrl: string;

  constructor() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error(
        'NEXT_PUBLIC_API_URL environment variable is not set. Cannot initialize bulk enrichment service.',
      );
    }
    this.apiUrl = baseUrl;
  }

  /**
   * Get Firebase ID token for authenticated requests
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      return await user.getIdToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Enrich multiple tickets in parallel
   *
   * Streams SSE progress events including real-time agent progress.
   * Includes 60-second timeout to prevent hanging connections.
   *
   * NOTE: Uses fetch with streaming response instead of EventSource because:
   * - EventSource only supports GET requests
   * - This endpoint requires POST with JSON body
   * - fetch with Response.body.getReader() gives us streaming capability
   *
   * Repository fields are not sent - they're only needed during deep analysis,
   * which happens per-ticket in the controller. Question generation doesn't
   * require repository information.
   *
   * @param ticketIds IDs of tickets to enrich
   * @param onProgress Callback for each progress event
   * @returns Promise that resolves when enrichment completes
   * @throws Error if timeout or connection failure
   */
  async enrichTickets(
    ticketIds: string[],
    onProgress?: (event: EnrichmentProgressEvent) => void,
  ): Promise<void> {
    const url = `${this.apiUrl}/tickets/bulk/enrich`;
    const TIMEOUT_MS = 60000; // 60 second timeout

    const body: BulkEnrichDto = {
      ticketIds,
      // Repository fields are not sent - not needed for question generation
    };

    // Get auth token
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authorization token available. Please ensure you are logged in.');
    }

    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout | null = null;
      let isCompleted = false;

      const resetTimeout = () => {
        if (timeout) clearTimeout(timeout);
        if (!isCompleted) {
          timeout = setTimeout(() => {
            isCompleted = true;
            reject(new Error('Enrichment timeout: No response for 60 seconds. Check your network connection.'));
          }, TIMEOUT_MS);
        }
      };

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Read the streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          const read = async (): Promise<void> => {
            const { done, value } = await reader.read();

            if (done) {
              isCompleted = true;
              if (timeout) clearTimeout(timeout);
              resolve();
              return;
            }

            resetTimeout(); // Reset timeout on each chunk received

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events
            const lines = buffer.split('\n');
            buffer = lines[lines.length - 1]; // Keep incomplete line in buffer

            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i];
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6)) as EnrichmentProgressEvent;
                  if (onProgress) {
                    onProgress(data);
                  }

                  if (data.type === 'complete' || data.type === 'error') {
                    reader.cancel();
                    isCompleted = true;
                    if (timeout) clearTimeout(timeout);

                    if (data.type === 'error') {
                      reject(new Error(data.message || 'Enrichment failed'));
                    } else {
                      resolve();
                    }
                    return;
                  }
                } catch (error) {
                  console.error('Failed to parse SSE event:', error);
                }
              }
            }

            return read();
          };

          return read();
        })
        .catch((error) => {
          isCompleted = true;
          if (timeout) clearTimeout(timeout);
          reject(error);
        });

      // Start initial timeout
      resetTimeout();
    });
  }

  /**
   * Finalize multiple enriched tickets in parallel
   *
   * Streams SSE progress events including real-time finalization progress.
   * Includes 60-second timeout to prevent hanging connections.
   *
   * @param answers Question answers from user (questionId -> answer)
   * @param onProgress Callback for each progress event
   * @returns Promise that resolves when finalization completes
   * @throws Error if timeout or connection failure
   */
  async finalizeTickets(
    answers: Array<{ ticketId: string; questionId: string; answer: string }>,
    onProgress?: (event: EnrichmentProgressEvent) => void,
  ): Promise<void> {
    const url = `${this.apiUrl}/tickets/bulk/finalize`;
    const TIMEOUT_MS = 60000; // 60 second timeout

    // Get auth token
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authorization token available. Please ensure you are logged in.');
    }

    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout | null = null;
      let isCompleted = false;

      const resetTimeout = () => {
        if (timeout) clearTimeout(timeout);
        if (!isCompleted) {
          timeout = setTimeout(() => {
            isCompleted = true;
            reject(new Error('Finalization timeout: No response for 60 seconds. Check your network connection.'));
          }, TIMEOUT_MS);
        }
      };

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Read the streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          const read = async (): Promise<void> => {
            const { done, value } = await reader.read();

            if (done) {
              isCompleted = true;
              if (timeout) clearTimeout(timeout);
              resolve();
              return;
            }

            resetTimeout(); // Reset timeout on each chunk received

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events
            const lines = buffer.split('\n');
            buffer = lines[lines.length - 1]; // Keep incomplete line in buffer

            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i];
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6)) as EnrichmentProgressEvent;
                  if (onProgress) {
                    onProgress(data);
                  }

                  if (data.type === 'error') {
                    reader.cancel();
                    isCompleted = true;
                    if (timeout) clearTimeout(timeout);
                    reject(new Error(data.message || 'Finalization failed'));
                    return;
                  }
                } catch (error) {
                  console.error('Failed to parse SSE event:', error);
                }
              }
            }

            return read();
          };

          return read();
        })
        .catch((error) => {
          isCompleted = true;
          if (timeout) clearTimeout(timeout);
          reject(error);
        });

      // Start initial timeout
      resetTimeout();
    });
  }
}

/**
 * Factory function for creating BulkEnrichmentService with dependency injection
 */
export function useBulkEnrichmentService(): BulkEnrichmentService {
  return new BulkEnrichmentService();
}
