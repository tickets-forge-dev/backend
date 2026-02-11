/**
 * PRD Breakdown Types
 *
 * Defines the domain types for breaking down Product Requirements Documents (PRDs)
 * into executable Forge tickets.
 */

/**
 * Acceptance criterion in BDD format
 */
export interface BDDCriterion {
  given: string; // Precondition
  when: string; // Action/trigger
  then: string; // Expected outcome
}

/**
 * Individual ticket from a PRD breakdown
 */
export interface PRDBreakdownTicket {
  // Metadata
  id: number; // Numeric index for referencing in dependencies
  epicName: string; // Which epic this belongs to
  epicIndex: number; // Index of epic (1, 2, 3...)
  storyIndex: number; // Index within epic (1, 2, 3...)

  // Content
  title: string; // Story title
  description: string; // User story format: "As a..., I want..., So that..."
  type: 'feature' | 'bug' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Acceptance Criteria
  acceptanceCriteria: BDDCriterion[]; // BDD-style criteria

  // Coverage & Dependencies
  functionalRequirements: string[]; // Which FRs this story covers (e.g., ["FR1", "FR2"])
  blockedBy: number[]; // IDs of stories that must complete first

  // Implementation guidance
  technicalNotes?: string;
}

/**
 * Epic grouping
 */
export interface PRDBreakdownEpic {
  index: number;
  name: string;
  goal: string; // User value statement
  stories: PRDBreakdownTicket[];
  functionalRequirements: string[]; // FRs covered by this epic
}

/**
 * Summary statistics
 */
export interface PRDBreakdownSummary {
  totalTickets: number;
  epicCount: number;
  epics: PRDBreakdownEpic[];
  frCoverage: Record<string, string[]>; // FR -> list of ticket titles covering it
  frInventory: Array<{
    id: string;
    description: string;
  }>;
}

/**
 * Complete PRD breakdown result
 */
export interface PRDBreakdownResult {
  tickets: PRDBreakdownTicket[];
  summary: PRDBreakdownSummary;
}

/**
 * PRD breakdown command (input to use case)
 */
export interface PRDBreakdownCommand {
  prdText: string;
  repositoryOwner?: string; // Optional - not needed for content-only PRD analysis
  repositoryName?: string; // Optional - not needed for content-only PRD analysis
  projectName?: string;
  workspaceId: string;
  onProgress?: (step: string, message: string) => void;
}
