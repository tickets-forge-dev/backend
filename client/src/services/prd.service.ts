/**
 * PRD Service
 *
 * API client for PRD breakdown and bulk ticket creation
 */

import { auth } from '@/lib/firebase';
import type { BreakdownResult } from '@/tickets/stores/prd-breakdown.store';

export interface PRDBreakdownRequest {
  prdText: string;
  repositoryOwner?: string;
  repositoryName?: string;
  projectName?: string;
}

export interface PRDBreakdownResponse {
  breakdown: BreakdownResult;
  analysisTime: number;
  estimatedTicketsCount: number;
}

export interface BulkCreateRequest {
  tickets: Array<{
    epicName: string;
    title: string;
    description: string;
    type: 'feature' | 'bug' | 'task';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    acceptanceCriteria: string;
  }>;
}

export interface BulkCreateResponse {
  results: Array<{
    originalIndex: number;
    title: string;
    ticketId?: string;
    error?: string;
  }>;
}

/**
 * Progress event from PRD breakdown SSE stream
 */
export interface PRDBreakdownProgressEvent {
  type: 'progress' | 'complete' | 'error';
  step?: string;
  message?: string;
  breakdown?: BreakdownResult;
  analysisTime?: number;
  estimatedTicketsCount?: number;
}

/**
 * PRD Service - handles PRD breakdown API calls
 */
class PRDService {
  private apiUrl: string;

  constructor() {
    // Allow undefined during SSG/build time - will validate on first use
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  /**
   * Validate API URL is configured (lazy validation for SSG compatibility)
   */
  private validateApiUrl(): void {
    if (!this.apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL not configured');
    }
  }

  /**
   * Analyze a PRD and return breakdown into epics and stories (legacy JSON endpoint)
   */
  async breakdownPRD(request: PRDBreakdownRequest): Promise<PRDBreakdownResponse> {
    this.validateApiUrl();
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`${this.apiUrl}/tickets/breakdown/prd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(
        error.message ||
          `Failed to analyze PRD: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Analyze a PRD with real-time progress streaming
   * Streams SSE events showing analysis progress
   */
  async breakdownPRDWithProgress(
    request: PRDBreakdownRequest,
    onProgress?: (event: PRDBreakdownProgressEvent) => void,
  ): Promise<PRDBreakdownResponse> {
    this.validateApiUrl();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authorization token available. Please ensure you are logged in.');
    }

    const TIMEOUT_MS = 120000; // 120 second timeout for PRD analysis

    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout | null = null;
      let isCompleted = false;

      const resetTimeout = () => {
        if (timeout) clearTimeout(timeout);
        if (!isCompleted) {
          timeout = setTimeout(() => {
            isCompleted = true;
            reject(new Error('PRD analysis timeout: No response for 120 seconds. Check your network connection.'));
          }, TIMEOUT_MS);
        }
      };

      fetch(`${this.apiUrl}/tickets/breakdown/prd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
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
          let finalResult: PRDBreakdownResponse | null = null;

          const read = async (): Promise<void> => {
            const { done, value } = await reader.read();

            if (done) {
              isCompleted = true;
              if (timeout) clearTimeout(timeout);
              if (finalResult) {
                resolve(finalResult);
              } else {
                reject(new Error('No final result received'));
              }
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
                  const data = JSON.parse(line.slice(6)) as PRDBreakdownProgressEvent;
                  if (onProgress) {
                    onProgress(data);
                  }

                  if (data.type === 'complete') {
                    if (data.breakdown && data.analysisTime !== undefined && data.estimatedTicketsCount !== undefined) {
                      finalResult = {
                        breakdown: data.breakdown,
                        analysisTime: data.analysisTime,
                        estimatedTicketsCount: data.estimatedTicketsCount,
                      };
                    }
                  } else if (data.type === 'error') {
                    reader.cancel();
                    isCompleted = true;
                    if (timeout) clearTimeout(timeout);
                    reject(new Error(data.message || 'PRD analysis failed'));
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
   * Bulk create tickets from breakdown result
   */
  async bulkCreateFromBreakdown(request: BulkCreateRequest): Promise<BulkCreateResponse> {
    this.validateApiUrl();
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`${this.apiUrl}/tickets/breakdown/bulk-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(
        error.message ||
          `Failed to create tickets: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Save a breakdown draft to browser localStorage
   * Phase 2: Uses client-side storage for MVP, can be upgraded to Firestore later
   */
  async saveDraft(breakdown: BreakdownResult, prdText: string, projectName?: string): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('Draft saving only available in browser');
    }

    const draftId = `draft-${Date.now()}`;
    const draft = {
      id: draftId,
      prdText,
      projectName,
      breakdown,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`prd-breakdown-${draftId}`, JSON.stringify(draft));
      // Also update the latest draft pointer
      localStorage.setItem('prd-breakdown-latest', draftId);
      return draftId;
    } catch (error) {
      throw new Error('Failed to save draft to local storage');
    }
  }

  /**
   * Load a specific draft from browser localStorage
   */
  async loadDraft(draftId: string): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('Draft loading only available in browser');
    }

    try {
      const draft = localStorage.getItem(`prd-breakdown-${draftId}`);
      if (!draft) {
        throw new Error(`Draft not found: ${draftId}`);
      }
      return JSON.parse(draft);
    } catch (error) {
      throw new Error(`Failed to load draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the most recent draft from browser localStorage
   */
  async getLatestDraft(): Promise<any | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const draftId = localStorage.getItem('prd-breakdown-latest');
      if (!draftId) {
        return null;
      }

      const draft = localStorage.getItem(`prd-breakdown-${draftId}`);
      if (!draft) {
        return null;
      }

      const parsed = JSON.parse(draft);
      // Only return if it was created in the last 24 hours
      const createdAt = new Date(parsed.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (createdAt < oneDayAgo) {
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a draft from browser localStorage
   */
  async deleteDraft(draftId: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Draft deletion only available in browser');
    }

    try {
      localStorage.removeItem(`prd-breakdown-${draftId}`);
      // Clear the latest draft pointer if this was the latest
      const latestId = localStorage.getItem('prd-breakdown-latest');
      if (latestId === draftId) {
        localStorage.removeItem('prd-breakdown-latest');
      }
    } catch (error) {
      throw new Error('Failed to delete draft from local storage');
    }
  }
}

// Singleton instance
let prdService: PRDService | null = null;

/**
 * Hook for using the PRD service
 */
export function usePRDService(): PRDService {
  if (!prdService) {
    prdService = new PRDService();
  }
  return prdService;
}
