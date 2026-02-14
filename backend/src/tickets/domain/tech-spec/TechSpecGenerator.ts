/**
 * TechSpecGenerator - Domain Port for Technical Specification Generation
 *
 * Generates BMAD-style technical specifications with full codebase context.
 * Specifications are definitive, specific, and code-aware with zero ambiguity.
 *
 * Integrates with:
 * - GitHubFileService (9-1): Reads relevant code files
 * - ProjectStackDetector (9-2): Provides technology stack context
 * - CodebaseAnalyzer (9-3): Provides pattern and architecture context
 *
 * @example
 * ```typescript
 * const generator = new TechSpecGeneratorImpl(llmClient);
 * const spec = await generator.generate({
 *   title: 'Add user authentication with Zustand',
 *   description: 'Implement JWT-based auth flow',
 *   owner: 'myorg',
 *   repo: 'myapp',
 *   githubContext: { tree, files },
 *   stack: projectStack,
 *   analysis: codebaseAnalysis,
 * });
 * // Returns: TechSpec with problem statement, solution, acceptance criteria,
 * // clarification questions, file changes, and quality score
 * ```
 */

import { FileTree } from '@github/domain/github-file.service';
import { ProjectStack } from '@tickets/domain/stack-detection/ProjectStackDetector';
import { CodebaseAnalysis } from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';
import { DesignReference } from '../value-objects/DesignReference';

/**
 * Input for tech spec generation
 */
export interface TechSpecInput {
  title: string; // Required: title of the specification
  description?: string; // Optional: detailed description
  owner: string; // GitHub repository owner
  repo: string; // GitHub repository name
  branch?: string; // Optional: branch name (default: main)
  githubContext: {
    tree: FileTree; // Repository file tree structure
    files: Map<string, string>; // Map of file paths to contents
  };
  stack: ProjectStack; // Project technology stack
  analysis: CodebaseAnalysis; // Codebase analysis results
  ticketType?: 'feature' | 'bug' | 'task'; // Optional: ticket type
  reproductionSteps?: ReproductionStep[]; // Optional: bug reproduction steps
  designReferences?: DesignReference[]; // Optional: design references (Figma, Loom, etc.) with metadata
}

/**
 * Problem statement section of a tech spec
 *
 * Explains what problem is being solved, why it matters, and relevant context
 */
export interface ProblemStatement {
  narrative: string; // Clear explanation of what problem we're solving
  whyItMatters: string; // Impact, importance, and business value
  context: string; // Relevant background and project context
  assumptions: string[]; // Key assumptions (2-3 minimum)
  constraints: string[]; // Known constraints and limitations (2-3 minimum)
}

/**
 * Individual step in a solution
 */
export interface SolutionStep {
  order: number; // Step sequence number
  description: string; // Clear description of what to do in this step
  file?: string; // Optional: file path if specific file involved (full path from project root)
  lineNumbers?: [number, number]; // Optional: [start, end] line numbers for modifications
  codeSnippet?: string; // Optional: relevant code reference or snippet
}

/**
 * Solution section of a tech spec
 *
 * Detailed implementation steps with specific file paths, line numbers, and code references
 */
export interface SolutionSection {
  overview: string; // High-level solution description
  steps: SolutionStep[]; // Ordered implementation steps (5+ recommended)
  fileChanges: {
    create: string[]; // Files to create (full paths)
    modify: string[]; // Files to modify (full paths)
    delete?: string[]; // Files to delete (full paths)
  };
  databaseChanges?: string; // Optional: database schema or migration notes
  environmentChanges?: string; // Optional: environment variable or config changes
}

/**
 * Acceptance criterion in BDD Given/When/Then format
 *
 * Each criterion is testable and unambiguous
 */
export interface AcceptanceCriterion {
  given: string; // Initial condition or context (BDD: "Given...")
  when: string; // Action or trigger (BDD: "When...")
  then: string; // Expected result or outcome (BDD: "Then...")
  implementationNotes?: string; // Optional: how to test or implement this criterion
}

/**
 * Type for clarification question input type
 */
export type QuestionType = 'radio' | 'checkbox' | 'text' | 'select' | 'multiline';

/**
 * Clarification question for ambiguous requests
 *
 * Helps resolve ambiguities in the original specification request
 */
export interface ClarificationQuestion {
  id: string; // Unique question identifier
  question: string; // The question to ask
  type: QuestionType; // Input type: radio, checkbox, text, select, multiline
  options?: string[]; // Optional: available options (for radio/checkbox/select)
  defaultValue?: string | string[]; // Optional: suggested default answer
  context?: string; // Optional: why this question is being asked
  impact?: string; // Optional: how the answer affects the spec
}

/**
 * File change specification
 *
 * Describes a specific file that needs to be created, modified, or deleted
 */
export interface FileChange {
  path: string; // Full file path from project root
  action: 'create' | 'modify' | 'delete'; // Action to perform
  lineNumbers?: [number, number]; // Optional: [start, end] for modifications
  suggestedContent?: string; // Optional: suggested content for creation
  suggestedChanges?: string; // Optional: specific changes for modification
  imports?: {
    add?: string[]; // Imports to add
    remove?: string[]; // Imports to remove
  };
  pattern?: string; // Optional: reference to existing code pattern to follow
}

/**
 * API endpoint detected in the codebase or required by the task
 */
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  route: string; // e.g., "/api/v1/tickets/:id"
  controller?: string; // File path to controller
  dto?: {
    request?: string; // DTO type or inline shape
    response?: string; // DTO type or inline shape
  };
  description: string;
  authentication?: 'required' | 'optional' | 'none';
  status: 'new' | 'modified' | 'deprecated';
}

/**
 * API changes section of a tech spec
 */
export interface ApiChanges {
  endpoints: ApiEndpoint[];
  baseUrl?: string;
  middlewares?: string[];
  rateLimiting?: string;
}

/**
 * File changes organized by architectural layer
 */
export interface LayeredFileChanges {
  backend: FileChange[];
  frontend: FileChange[];
  shared: FileChange[];
  infrastructure: FileChange[];
  documentation: FileChange[];
}

/**
 * Individual test case in a test plan
 */
export interface TestCase {
  type: 'unit' | 'integration' | 'e2e' | 'edge-case';
  description: string;
  testFile: string; // Suggested test file path
  testName: string; // Test name (describe/it format)
  setup?: string; // Arrange
  action: string; // Act
  assertion: string; // Assert
  dependencies?: string[]; // Mocks, fixtures
}

/**
 * Test plan section of a tech spec
 */
export interface TestPlan {
  summary: string; // High-level testing approach
  unitTests: TestCase[]; // 5+ minimum
  integrationTests: TestCase[]; // 2+ minimum
  edgeCases: TestCase[]; // 2+ minimum
  testingNotes?: string;
  coverageGoal?: number; // e.g., 80
}

/**
 * A single visual QA expectation — describes what a screen/state should look like
 */
export interface VisualExpectation {
  screen: string; // Component or page being tested (e.g., "Ticket Detail — API Section")
  state: 'default' | 'loading' | 'error' | 'empty' | 'success' | 'interaction';
  description: string; // What the user should see in this state
  wireframe: string; // ASCII wireframe of the expected UI
  steps: string[]; // Steps to reach this state
  acceptanceCriterionRef?: string; // Which AC this validates (e.g., "AC-1")
}

/**
 * Visual QA expectations section of a tech spec
 */
export interface VisualExpectations {
  summary: string; // High-level overview of what to visually verify
  expectations: VisualExpectation[]; // Individual visual expectations
  flowDiagram?: string; // Optional ASCII flow diagram of the happy path
}

/**
 * Structured API call details for bug reproduction steps
 *
 * Enables rich documentation of API interactions without plain text
 */
export interface ApiCallDetails {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string; // Full URL or relative path
  headers?: Record<string, string>; // Request headers
  body?: string; // Request body (JSON string)
  expectedStatus?: number; // Expected HTTP status (e.g., 200)
  actualStatus?: number; // Actual status received (e.g., 500)
  responseBody?: string; // Actual response received
  timing?: number; // Request duration in ms
}

/**
 * Single reproduction step in a bug report
 *
 * Ordered, rich-content step with action, expected vs actual behavior,
 * and optional API details, console logs, screenshots
 */
export interface ReproductionStep {
  order: number; // Step sequence (1-based)
  action: string; // User action description (required)
  expectedBehavior?: string; // What should happen
  actualBehavior?: string; // What actually happens (bug behavior)

  // Rich content (all optional)
  apiCall?: ApiCallDetails; // Structured API call
  screenshot?: {
    attachmentId: string; // Reference to uploaded attachment
    caption?: string;
  };
  consoleLog?: string; // Console error/warning logs (max 10k chars)
  codeSnippet?: string; // Code that triggers the bug
  notes?: string; // Additional context
}

/**
 * Bug-specific details section for bug tickets
 *
 * Contains reproduction steps, environment context, frequency/impact,
 * and AI analysis (suspected cause, related files, suggested fix)
 *
 * Only present in TechSpec when ticket.type === 'bug'
 */
export interface BugDetails {
  reproductionSteps: ReproductionStep[]; // Ordered steps to reproduce (3-7 typical)
  environment?: {
    browser?: string; // Chrome 120, Firefox 115, Safari 17, etc.
    os?: string; // macOS 14.2, Windows 11, Ubuntu 22.04, etc.
    viewport?: string; // Desktop 1920x1080, Mobile 375x667, etc.
    userRole?: string; // Admin, User, Guest, etc.
  };
  frequency?: 'always' | 'sometimes' | 'rarely'; // How often bug occurs
  impact?: 'critical' | 'high' | 'medium' | 'low'; // Business impact

  // AI-detected analysis
  relatedFiles?: string[]; // Files likely involved in bug
  suspectedCause?: string; // AI's hypothesis about root cause
  suggestedFix?: string; // AI's initial fix suggestion
}

/**
 * Complete technical specification
 *
 * Contains all sections: problem, solution, acceptance criteria, questions, file changes,
 * quality score, and any ambiguity flags. Includes optional bug-specific details.
 */
export interface TechSpec {
  id: string; // Unique specification identifier
  title: string; // Specification title
  createdAt: Date; // Generation timestamp
  problemStatement: ProblemStatement; // Problem definition
  solution: SolutionSection; // Implementation solution
  inScope: string[]; // Explicitly in-scope items (3-5 minimum)
  outOfScope: string[]; // Explicitly out-of-scope items (3-5 minimum)
  acceptanceCriteria: AcceptanceCriterion[]; // Acceptance criteria (5+ recommended)
  clarificationQuestions: ClarificationQuestion[]; // Clarification questions (0-4 typical)
  fileChanges: FileChange[]; // File changes needed
  qualityScore: number; // Quality score 0-100
  ambiguityFlags: string[]; // Issues found during validation (should be empty)
  stack?: {
    language?: string; // Detected language (e.g., "TypeScript")
    framework?: string; // Detected framework (e.g., "React", "NestJS")
    packageManager?: string; // Detected package manager (e.g., "npm", "yarn")
  }; // Auto-detected technology stack at generation time
  apiChanges?: ApiChanges; // API endpoints affected by this spec
  layeredFileChanges?: LayeredFileChanges; // File changes organized by layer
  testPlan?: TestPlan; // Comprehensive test plan
  visualExpectations?: VisualExpectations; // Visual QA expectations with wireframes
  bugDetails?: BugDetails; // Bug-specific reproduction steps (only for type === 'bug')
  designTokens?: {
    colors: Array<{ name: string; value: string; description?: string }>;
    typography: Array<{ name: string; value: string; description?: string }>;
    spacing: Array<{ name: string; value: string; description?: string }>;
    shadows: Array<{ name: string; value: string; description?: string }>;
  }; // Extracted design tokens from Figma/design files (colors, typography, etc.)
}

/**
 * Context object for generation methods
 *
 * Aggregates codebase context for use in generation
 */
export interface CodebaseContext {
  stack: ProjectStack;
  analysis: CodebaseAnalysis;
  fileTree: FileTree;
  files: Map<string, string>;
  taskAnalysis?: any;
}

/**
 * User answer to a clarification question
 *
 * Used in iterative refinement workflow to track answers across rounds
 */
export interface AnswerContext {
  questionId: string;
  answer: string | string[];
}

/**
 * Technical Specification Generator Interface
 *
 * Generates BMAD-style technical specifications with zero ambiguity.
 * Uses LLM with full context injection: stack, patterns, code examples.
 *
 * Key principles:
 * 1. Context injection: Every prompt includes framework, language, architecture, patterns
 * 2. Role setting: "You are a technical specification writer..."
 * 3. Definitive language: No "or" statements, no "might"/"could" - use "will"/"must"
 * 4. Code awareness: Reference specific files, line numbers, existing patterns
 * 5. Quality validation: Score completeness and specificity (0-100 scale)
 *
 * @interface
 */
export interface TechSpecGenerator {
  /**
   * Generates a complete technical specification
   *
   * Orchestrates the full specification generation pipeline:
   * 1. Problem statement generation
   * 2. Solution generation
   * 3. Acceptance criteria generation
   * 4. Clarification questions generation
   * 5. File changes identification
   * 6. Ambiguity detection and removal
   * 7. Quality scoring
   *
   * @param input - Specification input with title, description, and codebase context
   * @returns Complete TechSpec with all sections
   */
  generate(input: TechSpecInput): Promise<TechSpec>;

  /**
   * Generates the Problem Statement section
   *
   * Explains what problem is being solved, why it matters, and relevant context.
   * Uses LLM with injected stack, patterns, and project context.
   *
   * @param title - Specification title
   * @param description - Specification description
   * @param context - Codebase context (stack, analysis, files)
   * @returns Problem statement with narrative, importance, context, assumptions, constraints
   */
  generateProblemStatement(
    title: string,
    description: string,
    context: CodebaseContext,
  ): Promise<ProblemStatement>;

  /**
   * Generates the Solution section
   *
   * Creates step-by-step implementation plan with specific file paths, line numbers,
   * and code references. References existing patterns and conventions.
   *
   * @param problem - Problem statement context
   * @param context - Codebase context
   * @returns Solution with overview, steps, and file changes
   */
  generateSolution(problem: ProblemStatement, context: CodebaseContext): Promise<SolutionSection>;

  /**
   * Generates Acceptance Criteria in BDD format
   *
   * Creates 5+ criteria in Given/When/Then format, each testable and unambiguous.
   * References specific files, functions, or components where applicable.
   * Includes edge cases and error scenarios.
   *
   * @param context - Codebase context
   * @returns Array of acceptance criteria (5+ minimum)
   */
  generateAcceptanceCriteria(context: CodebaseContext): Promise<AcceptanceCriterion[]>;

  /**
   * Generates clarification questions for ambiguous requests
   *
   * Identifies ambiguities in the original request and generates structured
   * clarification questions (radio, checkbox, text, select, multiline).
   *
   * @param context - Codebase context
   * @returns Array of clarification questions (0-4 typical, empty if no ambiguities)
   */
  generateClarificationQuestions(context: CodebaseContext): Promise<ClarificationQuestion[]>;

  /**
   * Identifies files that need to be created, modified, or deleted
   *
   * Analyzes the solution to determine all file changes, including:
   * - Specific file paths (validated against directory structure)
   * - Line numbers for modifications
   * - Suggested content for new files
   * - Imports to add/remove
   * - References to existing patterns
   *
   * @param solution - Solution section
   * @param context - Codebase context
   * @returns Array of file changes with specific paths and actions
   */
  generateFileChanges(solution: SolutionSection, context: CodebaseContext): Promise<FileChange[]>;

  /**
   * Calculates quality score for a specification
   *
   * Scoring breakdown (total 100 points):
   * - Problem Statement completeness (0-20)
   * - Solution specificity (0-25)
   * - Acceptance Criteria quality (0-15)
   * - File Changes clarity (0-10)
   * - Ambiguity and language (0-10)
   * - Test Plan coverage (0-10)
   * - Layer Categorization (0-5)
   * - API Changes documentation (0-5)
   *
   * Score reflects completeness and specificity of the specification.
   *
   * @param spec - Generated specification
   * @returns Quality score 0-100
   */
  calculateQualityScore(spec: TechSpec): number;

  /**
   * Generates clarification questions with context from prior rounds
   *
   * Used in iterative refinement workflow (Rounds 2+) to generate targeted
   * follow-up questions based on answers from previous rounds.
   *
   * Round 1 generates initial questions identifying ambiguities.
   * Rounds 2+ can generate refinement questions or return empty array if
   * sufficient information has been gathered.
   *
   * @param input - Generation input including title, context, and prior answers
   * @returns Array of clarification questions (can be empty if no more questions needed)
   */
  generateQuestionsWithContext(input: {
    title: string;
    description?: string;
    context: CodebaseContext;
    priorAnswers: AnswerContext[];
    roundNumber: number;
  }): Promise<ClarificationQuestion[]>;

  /**
   * Determines if more clarification questions are needed
   *
   * Evaluates accumulated answers to decide if sufficient context exists
   * to generate a definitive technical specification, or if more
   * clarification questions would improve the spec quality.
   *
   * Returns true if agent should ask more questions, false if ready to finalize.
   * Hard stop at round 3 - will always return false when currentRound >= 3.
   *
   * @param input - Decision input with accumulated answers and context
   * @returns Boolean indicating if more questions are needed
   */
  shouldAskMoreQuestions(input: {
    title: string;
    description?: string;
    context: CodebaseContext;
    answeredQuestions: AnswerContext[];
    currentRound: number;
  }): Promise<boolean>;

  /**
   * Generates final technical specification with accumulated answers
   *
   * Used after question refinement rounds are complete. Generates a complete
   * TechSpec incorporating all answers from all rounds for maximum spec quality
   * and specificity.
   *
   * Produces more definitive spec than generate() method alone because it has
   * answers to clarification questions.
   *
   * @param input - Generation input with all accumulated answers
   * @returns Complete TechSpec with all sections informed by answers
   */
  generateWithAnswers(input: {
    title: string;
    description?: string;
    context: CodebaseContext;
    answers: AnswerContext[];
  }): Promise<TechSpec>;
}
