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
 * A single visual QA expectation — describes what a screen/state should look like
 */
export interface VisualExpectationSpec {
  screen: string;
  state: 'default' | 'loading' | 'error' | 'empty' | 'success' | 'interaction';
  description: string;
  wireframe: string;
  steps: string[];
  acceptanceCriterionRef?: string;
}

/**
 * Visual QA expectations section
 */
export interface VisualExpectationsSpec {
  summary: string;
  expectations: VisualExpectationSpec[];
  flowDiagram?: string;
}

/**
 * Structured API call details for bug reproduction steps (frontend)
 */
export interface ApiCallDetailsSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  expectedStatus?: number;
  actualStatus?: number;
  responseBody?: string;
  timing?: number;
}

/**
 * Single reproduction step in a bug report (frontend)
 */
export interface ReproductionStepSpec {
  order: number;
  action: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  apiCall?: ApiCallDetailsSpec;
  screenshot?: {
    attachmentId: string;
    caption?: string;
  };
  consoleLog?: string;
  codeSnippet?: string;
  notes?: string;
}

/**
 * Bug-specific details section for bug tickets (frontend)
 *
 * Only present in TechSpec when ticket.type === 'bug'
 */
export interface BugDetailsSpec {
  reproductionSteps: ReproductionStepSpec[];
  environment?: {
    browser?: string;
    os?: string;
    viewport?: string;
    userRole?: string;
  };
  frequency?: 'always' | 'sometimes' | 'rarely';
  impact?: 'critical' | 'high' | 'medium' | 'low';
  relatedFiles?: string[];
  suspectedCause?: string;
  suggestedFix?: string;
}

/**
 * Technical specification generated from questions
 */
/**
 * Package/dependency needed for this feature
 */
export interface PackageDependency {
  name: string; // Package name (e.g., "@octokit/rest")
  version?: string; // Suggested version (e.g., "^20.0.0")
  purpose: string; // Why this package is needed
  installCommand?: string; // How to install (e.g., "npm install @octokit/rest")
  documentationUrl?: string; // Link to package docs
  type: 'production' | 'development'; // Dependency type
  alternativesConsidered?: string[]; // Other packages evaluated
}

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
  visualExpectations?: VisualExpectationsSpec;
  bugDetails?: BugDetailsSpec;
  dependencies?: PackageDependency[]; // New packages/dependencies required for this feature
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
