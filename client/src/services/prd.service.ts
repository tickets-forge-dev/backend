/**
 * PRD Service
 *
 * API client for PRD breakdown and bulk ticket creation
 */

import { auth } from '@/lib/firebase';
import type { BreakdownResult } from '@/tickets/stores/prd-breakdown.store';

export interface PRDBreakdownRequest {
  prdText: string;
  repositoryOwner: string;
  repositoryName: string;
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
 * PRD Service - handles PRD breakdown API calls
 */
class PRDService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (!this.apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL not configured');
    }
  }

  /**
   * Analyze a PRD and return breakdown into epics and stories
   */
  async breakdownPRD(request: PRDBreakdownRequest): Promise<PRDBreakdownResponse> {
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
   * Bulk create tickets from breakdown result
   */
  async bulkCreateFromBreakdown(request: BulkCreateRequest): Promise<BulkCreateResponse> {
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
