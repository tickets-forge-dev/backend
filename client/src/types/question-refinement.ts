/**
 * Frontend-only types for question refinement workflow
 * These types mirror backend domain models but are defined in frontend
 * to maintain clean architecture separation.
 *
 * DO NOT import from backend domain code.
 */

/**
 * Question input type - determines how the question is displayed to user
 */
export type QuestionInputType = 'radio' | 'checkbox' | 'text' | 'multiline' | 'select';

/**
 * Clarification question - asked during refinement rounds
 */
export interface ClarificationQuestion {
  id: string;
  question: string;
  type: QuestionInputType;
  options?: string[]; // For radio/checkbox/select
  context?: string; // Why is this question being asked
  impact?: string; // How does the answer affect the spec
}

/**
 * Answer to a clarification question
 */
export type QuestionAnswer = string | string[] | null;

/**
 * User answers map for a round
 */
export interface RoundAnswers {
  [questionId: string]: QuestionAnswer;
}

/**
 * Single question round (1-3)
 */
export interface QuestionRound {
  roundNumber: number;
  questions: ClarificationQuestion[];
  answers: RoundAnswers;
  generatedAt: Date; // When questions were generated
  answeredAt: Date | null; // When user answered (null if not answered yet)
  skippedByUser: boolean;
  codebaseContext?: string; // JSON string of context used for this round
}

/**
 * API endpoint detected or defined in the spec
 */
export interface ApiEndpointSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  route: string;
  controller?: string;
  dto?: {
    request?: string;
    response?: string;
  };
  description: string;
  authentication?: 'required' | 'optional' | 'none';
  status: 'new' | 'modified' | 'deprecated';
  headers?: string;
  requestBody?: string;
}

/**
 * Test case in a test plan
 */
export interface TestCaseSpec {
  type: 'unit' | 'integration' | 'e2e' | 'edge-case';
  description: string;
  testFile: string;
  testName: string;
  setup?: string;
  action: string;
  assertion: string;
  dependencies?: string[];
}

/**
 * Technical specification generated from questions
 */
export interface TechSpec {
  problemStatement: string | {
    narrative: string;
    whyItMatters: string;
    context: string;
    assumptions: string[];
    constraints: string[];
  };
  solution: string[]; // Step-by-step solution
  acceptanceCriteria: string[];
  fileChanges: Array<{
    path: string;
    type: 'create' | 'modify' | 'delete';
  }>;
  qualityScore: number; // 0-100
  generatedAt: Date;
  stack?: {
    language?: string; // Detected language (e.g., "TypeScript")
    framework?: string; // Detected framework (e.g., "React", "NestJS")
    packageManager?: string; // Detected package manager (e.g., "npm", "yarn")
  }; // Auto-detected technology stack at generation time
  apiChanges?: {
    endpoints: ApiEndpointSpec[];
    baseUrl?: string;
    middlewares?: string[];
    rateLimiting?: string;
  };
  layeredFileChanges?: {
    backend: Array<{ path: string; action: string }>;
    frontend: Array<{ path: string; action: string }>;
    shared: Array<{ path: string; action: string }>;
    infrastructure: Array<{ path: string; action: string }>;
    documentation: Array<{ path: string; action: string }>;
  };
  testPlan?: {
    summary: string;
    unitTests: TestCaseSpec[];
    integrationTests: TestCaseSpec[];
    edgeCases: TestCaseSpec[];
    testingNotes?: string;
    coverageGoal?: number;
  };
}

/**
 * API request to start a question round
 */
export interface StartQuestionRoundRequest {
  roundNumber: number;
  priorAnswers?: RoundAnswers; // Answers from previous rounds
}

/**
 * API response from starting a round
 */
export interface StartQuestionRoundResponse {
  roundNumber: number;
  questions: ClarificationQuestion[];
  codebaseContext: string;
}

/**
 * API request to submit answers
 */
export interface SubmitAnswersRequest {
  roundNumber: number;
  answers: RoundAnswers;
}

/**
 * API response from submitting answers
 * Returns full AEC object (which includes updated questionRounds) + next action
 */
export interface SubmitAnswersResponse {
  aec: any; // Full AEC object with updated questionRounds, currentRound, techSpec
  nextAction: 'continue' | 'finalize';
}

/**
 * API request to finalize spec
 */
export interface FinalizeSpecRequest {
  allAnswers: RoundAnswers[]; // Answers from all rounds
}

/**
 * API response from finalizing spec
 */
export interface FinalizeSpecResponse {
  techSpec: TechSpec;
}
