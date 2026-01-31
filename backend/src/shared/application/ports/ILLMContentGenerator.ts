/**
 * Port (Interface) for LLM Content Generation
 *
 * Implementation details:
 * - Development: MastraContentGenerator using Ollama (local, free)
 * - Production: MastraContentGenerator using Anthropic/Claude (API)
 *
 * Used in Epic 2 for 4 LLM-powered generation steps:
 * 1. Intent extraction (fast model)
 * 2. Type detection (fast model)
 * 5. Ticket drafting (main model)
 * 7. Question generation (fast model)
 */

export interface IntentExtraction {
  intent: string;
  keywords: string[];
}

export interface TypeDetection {
  type: 'feature' | 'bug' | 'task';
  confidence: number; // 0-1
  reasoning?: string;
}

export interface TicketDraft {
  acceptanceCriteria: string[];
  assumptions: string[];
  repoPaths: string[];
}

export interface QuestionSet {
  questions: Array<{
    id: string;
    text: string;
    type: 'binary' | 'multi-choice';
    options: Array<{ label: string; value: string }>;
    defaultAssumption?: string;
  }>;
}

export interface ILLMContentGenerator {
  // Step 1: Extract intent from title + description
  extractIntent(input: {
    title: string;
    description?: string;
  }): Promise<IntentExtraction>;

  // Step 2: Detect ticket type (feature/bug/task)
  detectType(intent: string): Promise<TypeDetection>;

  // Step 5: Generate acceptance criteria, assumptions, affected code paths
  generateDraft(input: {
    intent: string;
    type: 'feature' | 'bug' | 'task';
    repoContext?: string; // From step 3
    apiContext?: string; // From step 4
  }): Promise<TicketDraft>;

  // Step 7: Generate clarification questions based on validation issues
  generateQuestions(input: {
    draft: TicketDraft;
    validationIssues: any[]; // From step 6
  }): Promise<QuestionSet>;
}

export const LLM_CONTENT_GENERATOR = Symbol('ILLMContentGenerator');
