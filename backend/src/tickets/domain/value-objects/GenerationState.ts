export interface GenerationStep {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed' | 'suspended';
  details?: string;
  error?: string;
  suspensionReason?: 'critical_findings' | 'questions';
}

export interface GenerationState {
  currentStep: number;
  steps: GenerationStep[];
  suspendedAt?: string; // Step ID where workflow is suspended
  findings?: any[]; // Critical findings for review
  questions?: any[]; // Clarifying questions
}

export class GenerationStateFactory {
  /**
   * Legacy 8-step generation (GenerationOrchestrator)
   */
  static initial(): GenerationState {
    return {
      currentStep: 1,
      steps: [
        { id: 1, title: 'Intent extraction', status: 'pending' },
        { id: 2, title: 'Type detection', status: 'pending' },
        { id: 3, title: 'Repo index query', status: 'pending' },
        { id: 4, title: 'API snapshot resolution', status: 'pending' },
        { id: 5, title: 'Ticket drafting', status: 'pending' },
        { id: 6, title: 'Validation', status: 'pending' },
        { id: 7, title: 'Question prep', status: 'pending' },
        { id: 8, title: 'Estimation', status: 'pending' },
      ],
    };
  }

  /**
   * HITL 12-step workflow (Mastra)
   * Includes 2 suspension points for user interaction
   */
  static initialHITL(): GenerationState {
    return {
      currentStep: 1,
      steps: [
        { id: 1, title: 'Extracting intent', status: 'pending' },
        { id: 2, title: 'Detecting type', status: 'pending' },
        { id: 3, title: 'Running preflight validation', status: 'pending' },
        { id: 4, title: 'Review findings', status: 'pending' }, // SUSPENSION POINT 1
        { id: 5, title: 'Gathering repository context', status: 'pending' },
        { id: 6, title: 'Gathering API context', status: 'pending' },
        { id: 7, title: 'Generating acceptance criteria', status: 'pending' },
        { id: 8, title: 'Generating questions', status: 'pending' },
        { id: 9, title: 'Ask questions', status: 'pending' }, // SUSPENSION POINT 2
        { id: 10, title: 'Refining draft', status: 'pending' },
        { id: 11, title: 'Finalizing ticket', status: 'pending' },
        { id: 12, title: 'Unlocking', status: 'pending' },
      ],
    };
  }

  /**
   * Simplified 6-step view for UI (grouped steps)
   * Per HITL-UX-SUMMARY.md: "Progress indicator shows only high-level steps (not all 11)"
   */
  static initialHITLSimplified(): GenerationState {
    return {
      currentStep: 1,
      steps: [
        { id: 1, title: 'Extracting intent', status: 'pending' },
        { id: 2, title: 'Detecting type', status: 'pending' },
        { id: 3, title: 'Running preflight validation', status: 'pending' },
        { id: 4, title: 'Gathering repository context', status: 'pending' },
        { id: 5, title: 'Generating acceptance criteria', status: 'pending' },
        { id: 6, title: 'Generating questions', status: 'pending' },
      ],
    };
  }
}
