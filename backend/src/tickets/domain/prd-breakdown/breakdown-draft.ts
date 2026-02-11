import { Timestamp } from 'firebase-admin/firestore';

/**
 * BreakdownDraft - Persisted state of a PRD breakdown analysis
 *
 * Allows users to:
 * - Resume interrupted analyses without re-running expensive LLM calls
 * - Save progress before navigating away
 * - Continue from last saved point
 */
export interface BreakdownDraft {
  id: string;
  workspaceId: string;
  userId: string;

  // Input
  prdText: string;
  projectName?: string;

  // Breakdown result
  breakdown: {
    epics: Array<{
      index: number;
      name: string;
      goal: string;
      stories: Array<{
        id: number;
        epicName: string;
        epicIndex: number;
        storyIndex: number;
        title: string;
        description: string;
        type: 'feature' | 'bug' | 'task';
        priority: 'low' | 'medium' | 'high' | 'urgent';
        acceptanceCriteria: Array<{
          given: string;
          when: string;
          then: string;
        }>;
        functionalRequirements: string[];
        blockedBy: number[];
        technicalNotes?: string;
        isSelected: boolean;
      }>;
      functionalRequirements: string[];
    }>;
    tickets: any[]; // Same structure as stories but flattened
    totalTickets: number;
    epicCount: number;
    frCoverage: Record<string, string[]>;
    frInventory: Array<{
      id: string;
      description: string;
    }>;
    analysisTime: number;
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp; // Optional TTL for cleanup
}

/**
 * CreateBreakdownDraftCommand
 */
export interface CreateBreakdownDraftCommand {
  workspaceId: string;
  userId: string;
  prdText: string;
  projectName?: string;
  breakdown: {
    epics: any[];
    tickets: any[];
    totalTickets: number;
    epicCount: number;
    frCoverage: Record<string, string[]>;
    frInventory: any[];
    analysisTime: number;
  };
}

/**
 * GetBreakdownDraftCommand
 */
export interface GetBreakdownDraftCommand {
  workspaceId: string;
  userId: string;
  draftId: string;
}

/**
 * GetLatestBreakdownDraftCommand
 */
export interface GetLatestBreakdownDraftCommand {
  workspaceId: string;
  userId: string;
}

/**
 * DeleteBreakdownDraftCommand
 */
export interface DeleteBreakdownDraftCommand {
  workspaceId: string;
  userId: string;
  draftId: string;
}
