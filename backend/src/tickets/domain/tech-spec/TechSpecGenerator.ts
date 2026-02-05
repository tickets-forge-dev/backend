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
 * Complete technical specification
 *
 * Contains all sections: problem, solution, acceptance criteria, questions, file changes,
 * quality score, and any ambiguity flags
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
  generateSolution(
    problem: ProblemStatement,
    context: CodebaseContext,
  ): Promise<SolutionSection>;

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
  generateFileChanges(
    solution: SolutionSection,
    context: CodebaseContext,
  ): Promise<FileChange[]>;

  /**
   * Calculates quality score for a specification
   *
   * Scoring breakdown (total 100 points):
   * - Problem Statement completeness (0-20)
   * - Solution specificity (0-30)
   * - Acceptance Criteria quality (0-20)
   * - File Changes clarity (0-15)
   * - Ambiguity and language (0-15)
   *
   * Score reflects completeness and specificity of the specification.
   *
   * @param spec - Generated specification
   * @returns Quality score 0-100
   */
  calculateQualityScore(spec: TechSpec): number;
}
