/**
 * TechSpecGeneratorImpl - Technical Specification Generation Service
 *
 * Generates BMAD-style technical specifications with full codebase context.
 * Uses LLM with context injection for definitive, zero-ambiguity specifications.
 *
 * Implementation approach:
 * 1. Each generation method follows: context injection → LLM call → parsing → validation
 * 2. Ambiguity detection: Scan output for "or", "might", "could", etc. → Rewrite with LLM
 * 3. Quality scoring: Deterministic algorithm with point allocations per section
 * 4. Error handling: Retry logic, timeouts, graceful degradation
 *
 * @implements TechSpecGenerator
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOllamaProvider } from '@shared/infrastructure/mastra/providers/ollama.provider';
import { randomUUID } from 'crypto';
import {
  TechSpecGenerator,
  TechSpecInput,
  ProblemStatement,
  SolutionSection,
  SolutionStep,
  AcceptanceCriterion,
  ClarificationQuestion,
  FileChange,
  TechSpec,
  CodebaseContext,
  QuestionType,
  ApiChanges,
  ApiEndpoint,
  LayeredFileChanges,
  TestPlan,
  TestCase,
} from '@tickets/domain/tech-spec/TechSpecGenerator';
import { ProjectStack } from '@tickets/domain/stack-detection/ProjectStackDetector';
import { CodebaseAnalysis } from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';

/**
 * Prompt templates for each section generation
 *
 * Key principle: Context injection at every level
 * - Stack (framework, language, tools)
 * - Architecture pattern
 * - Naming conventions
 * - Detected patterns
 * - Code samples
 */
class PromptTemplates {
  static systemPrompt(context: CodebaseContext): string {
    return `You are a technical specification writer specializing in code-aware specifications.
Your task is to generate ZERO-AMBIGUITY technical specifications.

CRITICAL: You MUST respond with ONLY valid JSON. No text before or after. No explanations. No apologies. Start your response with { or [. If you cannot fulfill the request, still respond with valid JSON using reasonable defaults.

RULES:
1. No "or" statements - all decisions are definitive
2. No "might", "could", "possibly" - use "will", "must", "shall"
3. All file paths must be complete and specific to the project
4. All code references must include exact line numbers when known
5. All acceptance criteria must be testable and unambiguous
6. Always reference existing code patterns and conventions
7. ALWAYS respond with valid JSON only - never plain text

PROJECT CONTEXT:
- Framework: ${context.stack.framework?.name || 'Unknown'}
- Language: ${context.stack.language?.name || 'Unknown'}
- Architecture: ${context.analysis.architecture.type}
- Testing: ${context.analysis.testing.runner || 'Not detected'}
- Package Manager: ${context.stack.packageManager?.type || 'npm'}
- Naming Conventions: Files=${context.analysis.naming.files}, Variables=${context.analysis.naming.variables}, Classes=${context.analysis.naming.classes}`;
  }

  static problemStatementPrompt(
    title: string,
    description: string,
  ): string {
    return `Analyze the following request and generate a problem statement:

Title: ${title}
Description: ${description || '(No description provided)'}

Generate valid JSON object with EXACTLY this structure (no extra fields):
{
  "narrative": "Clear explanation of what problem we're solving",
  "whyItMatters": "Impact, importance, and business value",
  "context": "Relevant background and project context",
  "assumptions": ["assumption 1", "assumption 2", "assumption 3"],
  "constraints": ["constraint 1", "constraint 2", "constraint 3"]
}

IMPORTANT:
- narrative: 2-3 sentences explaining the problem clearly
- whyItMatters: 2-3 sentences on impact and importance
- context: 1-2 sentences on relevant background
- assumptions: Array of 2-3 key assumptions
- constraints: Array of 2-3 known constraints
- Use definitive language (no "might", "could", "possibly")`;
  }

  static solutionPrompt(
    problem: ProblemStatement,
    context: CodebaseContext,
    files: Map<string, string>,
  ): string {
    const keyFiles = Array.from(files.keys())
      .slice(0, 5)
      .join(', ');

    return `Based on the following problem and project context, generate a detailed solution:

Problem: ${problem.narrative}
Why it matters: ${problem.whyItMatters}
Framework: ${context.stack.framework?.name || 'Unknown'}
Architecture: ${context.analysis.architecture.type}
Key files in codebase: ${keyFiles || 'Unknown'}

Generate valid JSON object with EXACTLY this structure:
{
  "overview": "High-level solution description (2-3 sentences)",
  "steps": [
    {
      "order": 1,
      "description": "Step description",
      "file": "path/to/file.ts (full path from project root)",
      "lineNumbers": [10, 50],
      "codeSnippet": "relevant code or pattern reference"
    }
  ],
  "fileChanges": {
    "create": ["path/to/new/file.ts"],
    "modify": ["path/to/existing/file.ts"],
    "delete": []
  }
}

IMPORTANT:
- Generate 5+ ordered steps
- Use actual file paths that match the project structure
- Include line numbers for modifications to existing files
- Reference existing patterns to follow
- All file paths must start from project root
- Use definitive language throughout`;
  }

  static acceptanceCriteriaPrompt(
    title: string,
    problemNarrative: string,
  ): string {
    return `Generate 5+ acceptance criteria in Given/When/Then format for:

Title: ${title}
Problem: ${problemNarrative}

Generate valid JSON array with EXACTLY this structure:
[
  {
    "given": "Initial condition or context",
    "when": "Action or trigger",
    "then": "Expected result",
    "implementationNotes": "How to test or verify this criterion"
  }
]

IMPORTANT:
- Generate 5+ criteria minimum
- Each criterion MUST have all 4 fields (given, when, then, implementationNotes)
- given/when/then must be complete sentences in past/present tense
- Include at least 1 error or edge case scenario
- All criteria must be testable and unambiguous
- Reference specific files, functions, or components in implementationNotes
- Use definitive language (no "might", "could", "possibly")
- Valid JSON only - ensure array brackets`;
  }

  static clarificationQuestionsPrompt(
    title: string,
    description: string,
  ): string {
    return `Identify ANY ambiguities in this request that need clarification:

Title: ${title}
Description: ${description || '(No description provided)'}

ONLY generate questions if ambiguities exist.
Generate valid JSON array with questions (can be empty array [] if no ambiguities):
[
  {
    "id": "q1",
    "question": "Specific question to ask",
    "type": "radio|checkbox|text|select|multiline",
    "options": ["option 1", "option 2"],
    "defaultValue": "option 1",
    "context": "Why we're asking this question",
    "impact": "How the answer affects the specification"
  }
]

Question type guide:
- radio: Single choice required
- checkbox: Multiple choices allowed
- text: Single line text input
- select: Dropdown selection
- multiline: Multi-line text input

IMPORTANT:
- Generate 0-4 questions (empty array [] if no ambiguities)
- Each question MUST have all 6 fields
- 'options' field only for radio/checkbox/select (can be empty for text/multiline)
- Question context must explain why this is ambiguous
- Impact must show how answer affects the specification
- Valid JSON array only`;
  }

  static testPlanPrompt(
    solutionOverview: string,
    acceptanceCriteria: AcceptanceCriterion[],
    fileChanges: FileChange[],
  ): string {
    const acText = acceptanceCriteria
      .map((ac, i) => `${i + 1}. Given ${ac.given}, When ${ac.when}, Then ${ac.then}`)
      .join('\n');

    const filesText = fileChanges
      .map((fc) => `- ${fc.path} (${fc.action})`)
      .join('\n');

    return `Generate a comprehensive test plan for this implementation:

Solution: ${solutionOverview}

Acceptance Criteria:
${acText || '(None provided)'}

Files to change:
${filesText || '(None specified)'}

Generate valid JSON object with EXACTLY this structure:
{
  "summary": "High-level testing approach (2-3 sentences)",
  "unitTests": [
    {
      "type": "unit",
      "description": "What this test verifies",
      "testFile": "path/to/test.spec.ts",
      "testName": "describe > it should ...",
      "setup": "Arrange: mock setup, test data",
      "action": "Act: method/function call",
      "assertion": "Assert: expected outcome",
      "dependencies": ["mock-name"]
    }
  ],
  "integrationTests": [
    {
      "type": "integration",
      "description": "What this integration test verifies",
      "testFile": "path/to/test.spec.ts",
      "testName": "describe > it should ...",
      "setup": "Arrange: setup",
      "action": "Act: action",
      "assertion": "Assert: outcome",
      "dependencies": []
    }
  ],
  "edgeCases": [
    {
      "type": "edge-case",
      "description": "Edge case scenario",
      "testFile": "path/to/test.spec.ts",
      "testName": "describe > it should handle ...",
      "setup": "Arrange",
      "action": "Act",
      "assertion": "Assert",
      "dependencies": []
    }
  ],
  "testingNotes": "Additional notes about testing strategy",
  "coverageGoal": 80
}

IMPORTANT:
- Generate 5+ unit tests covering core business logic
- Generate 2+ integration tests covering cross-module interactions
- Generate 2+ edge case tests covering error paths, boundary conditions
- Test file paths must match project conventions
- Each test must have setup, action, and assertion (Arrange-Act-Assert pattern)
- Include mock/fixture dependencies where needed
- Reference specific functions, classes, or modules from the file changes`;
  }

  static layerCategorizationPrompt(
    fileChanges: FileChange[],
    projectStructure: string,
  ): string {
    const filesText = fileChanges
      .map((fc) => `- ${fc.path} (${fc.action})`)
      .join('\n');

    return `Categorize these file changes by architectural layer:

Files:
${filesText}

Project structure context:
${projectStructure}

Generate valid JSON object with EXACTLY this structure:
{
  "backend": [files that are server-side: controllers, services, use-cases, domain, guards, middleware],
  "frontend": [files that are client-side: components, pages, stores, hooks, styles],
  "shared": [files shared between layers: types, interfaces, DTOs, shared packages],
  "infrastructure": [CI/CD, Docker, Terraform, GitHub Actions, build configs],
  "documentation": [markdown files, docs, READMEs]
}

Each array entry must have the same structure as the input file changes:
{ "path": "...", "action": "create|modify|delete" }

RULES:
- Every input file MUST appear in exactly one output category
- Use path patterns: backend/, server/, api/ → backend; client/, frontend/, .tsx/.jsx → frontend
- NestJS modules (.module.ts, .controller.ts, .service.ts) → backend
- Next.js pages, React components → frontend
- packages/, shared/, types/ → shared
- .github/, docker, terraform → infrastructure
- *.md, docs/ → documentation`;
  }

  static fileChangesPrompt(
    solutionOverview: string,
    directoryStructure: string,
  ): string {
    return `Based on the solution, identify ALL files that need to be created, modified, or deleted:

Solution: ${solutionOverview}
Project directory structure:
${directoryStructure}

Generate valid JSON array:
[
  {
    "path": "src/path/to/file.ts",
    "action": "create|modify|delete",
    "lineNumbers": [10, 50],
    "suggestedContent": "For create: stub or template code",
    "suggestedChanges": "For modify: specific changes to make",
    "imports": {
      "add": ["import { foo } from 'bar'"],
      "remove": ["import { oldFoo }"]
    },
    "pattern": "Reference to existing pattern to follow"
  }
]

IMPORTANT:
- action: MUST be "create", "modify", or "delete"
- path: Full path from project root
- lineNumbers: [start, end] only for modify action
- suggestedContent: Only for create action
- suggestedChanges: Only for modify action
- imports: Optional, only when imports change
- pattern: Reference to existing code pattern (e.g., "Follow UserStore pattern in src/stores/UserStore.ts")
- Valid JSON array only`;
  }
}

/**
 * TechSpecGeneratorImpl - Implementation of TechSpecGenerator
 *
 * Generates technical specifications with LLM integration and context injection.
 * Validates output for ambiguity and quality.
 */
@Injectable()
export class TechSpecGeneratorImpl implements TechSpecGenerator {
  private readonly logger = new Logger(TechSpecGeneratorImpl.name);
  private readonly llmModel: LanguageModel | null;
  private readonly providerName: string;

  private static readonly AMBIGUITY_MARKERS = [
    'or',
    'might',
    'could',
    'possibly',
    'maybe',
    'optional',
    'perhaps',
  ];

  private static readonly DEFINITIVE_MARKERS = ['will', 'must', 'shall', 'is', 'are'];

  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const defaultProvider = nodeEnv === 'production' ? 'anthropic' : 'ollama';
    const provider = this.configService.get<string>('LLM_PROVIDER') || defaultProvider;

    if (provider === 'anthropic') {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      const modelId = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-5-haiku-20241022';
      if (apiKey) {
        const anthropic = createAnthropic({ apiKey });
        this.llmModel = anthropic(modelId);
        this.providerName = `Anthropic (${modelId})`;
      } else {
        this.llmModel = null;
        this.providerName = 'mock (ANTHROPIC_API_KEY not set)';
      }
    } else {
      // Ollama (default) — local, free
      const modelId = this.configService.get<string>('OLLAMA_MODEL') || 'qwen2.5-coder:latest';
      const ollamaProvider = createOllamaProvider();
      this.llmModel = ollamaProvider.chat(modelId);
      this.providerName = `Ollama (${modelId})`;
    }

    this.logger.log(`LLM ready: ${this.providerName}`);
  }

  /**
   * Generates complete technical specification
   *
   * Orchestrates the full pipeline: problem → solution → AC → questions → file changes
   * Then applies ambiguity detection, validation, and quality scoring.
   */
  async generate(input: TechSpecInput): Promise<TechSpec> {
    const context: CodebaseContext = {
      stack: input.stack,
      analysis: input.analysis,
      fileTree: input.githubContext.tree,
      files: input.githubContext.files,
    };

    // Generate each section
    const problemStatement = await this.generateProblemStatement(
      input.title,
      input.description || '',
      context,
    );

    const solution = await this.generateSolution(problemStatement, context);

    const [acceptanceCriteria, clarificationQuestions, fileChanges, inScope, outOfScope, apiChanges] =
      await Promise.all([
        this.generateAcceptanceCriteria(context),
        this.generateClarificationQuestions(context),
        this.generateFileChanges(solution, context),
        this.generateScope(input.title, input.description || '', true),
        this.generateScope(input.title, input.description || '', false),
        this.extractApiChanges(context),
      ]);

    // Generate sections that depend on fileChanges (parallel)
    const [testPlan, layeredFileChanges] = await Promise.all([
      this.generateTestPlan(solution, acceptanceCriteria, fileChanges, context),
      this.categorizeFilesByLayer(fileChanges, context),
    ]);

    // Assemble tech spec
    const techSpec: TechSpec = {
      id: randomUUID(),
      title: input.title,
      createdAt: new Date(),
      problemStatement,
      solution,
      inScope,
      outOfScope,
      acceptanceCriteria,
      clarificationQuestions,
      fileChanges,
      qualityScore: 0, // Will be calculated below
      ambiguityFlags: [],
      stack: this.resolveStack(context),
      apiChanges,
      layeredFileChanges,
      testPlan,
    };

    // Detect and remove ambiguities
    techSpec.ambiguityFlags = this.detectAmbiguities(techSpec);
    if (techSpec.ambiguityFlags.length > 0) {
      await this.removeAmbiguities(techSpec);
    }

    // Calculate quality score
    techSpec.qualityScore = this.calculateQualityScore(techSpec);

    return techSpec;
  }

  /**
   * Generates the Problem Statement section
   */
  async generateProblemStatement(
    title: string,
    description: string,
    context: CodebaseContext,
  ): Promise<ProblemStatement> {
    try {
      const systemPrompt = PromptTemplates.systemPrompt(context);
      const userPrompt = PromptTemplates.problemStatementPrompt(title, description);

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<any>(response);

      return this.normalizeProblemStatement(parsed, title, description);
    } catch (error) {
      throw new Error(`Failed to generate problem statement: ${String(error)}`);
    }
  }

  /**
   * Normalizes any LLM response shape into a valid ProblemStatement.
   * If the LLM returns the expected shape, uses it directly.
   * If the LLM returns arbitrary JSON, extracts meaningful strings
   * and maps them into the expected fields.
   */
  private normalizeProblemStatement(
    parsed: any,
    title: string,
    description: string,
  ): ProblemStatement {
    // Happy path: already has the expected structure
    if (
      parsed.narrative &&
      parsed.whyItMatters &&
      Array.isArray(parsed.assumptions) &&
      Array.isArray(parsed.constraints)
    ) {
      return {
        narrative: String(parsed.narrative),
        whyItMatters: String(parsed.whyItMatters),
        context: String(parsed.context || ''),
        assumptions: parsed.assumptions.map(String).slice(0, 5),
        constraints: parsed.constraints.map(String).slice(0, 5),
      };
    }

    // Recovery: extract meaningful strings from arbitrary structure
    const strings = this.extractStringsFromObject(parsed);
    const arrays = this.extractStringArraysFromObject(parsed);

    return {
      narrative: strings[0] || `Implement: ${title}`,
      whyItMatters: strings[1] || description || 'Addresses a key requirement',
      context: strings[2] || '',
      assumptions: (arrays[0] || []).slice(0, 5),
      constraints: (arrays[1] || []).slice(0, 5),
    };
  }

  /** Recursively collect all meaningful strings (>15 chars) from an object */
  private extractStringsFromObject(obj: any, maxDepth = 5): string[] {
    const results: string[] = [];
    if (!obj || maxDepth <= 0) return results;
    if (typeof obj === 'string' && obj.length > 15) {
      results.push(obj);
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        results.push(...this.extractStringsFromObject(item, maxDepth - 1));
      }
    } else if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        results.push(...this.extractStringsFromObject(obj[key], maxDepth - 1));
      }
    }
    return results;
  }

  /** Recursively find string arrays from an object */
  private extractStringArraysFromObject(obj: any, maxDepth = 5): string[][] {
    const results: string[][] = [];
    if (!obj || maxDepth <= 0) return results;
    if (Array.isArray(obj) && obj.length > 0 && obj.every((v: any) => typeof v === 'string')) {
      results.push(obj);
    } else if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        results.push(...this.extractStringArraysFromObject(obj[key], maxDepth - 1));
      }
    }
    return results;
  }

  /**
   * Generates the Solution section
   */
  async generateSolution(
    problem: ProblemStatement,
    context: CodebaseContext,
  ): Promise<SolutionSection> {
    try {
      const systemPrompt = PromptTemplates.systemPrompt(context);
      const userPrompt = PromptTemplates.solutionPrompt(
        problem,
        context,
        context.files,
      );

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<SolutionSection>(response);

      // Validate structure
      if (!parsed.overview || !Array.isArray(parsed.steps) || !parsed.fileChanges) {
        throw new Error('Invalid solution structure');
      }

      // Ensure steps have required fields and are ordered
      parsed.steps = parsed.steps
        .map((step, index) => ({
          ...step,
          order: index + 1,
        }))
        .slice(0, 20); // Limit to 20 steps

      // Ensure fileChanges arrays exist
      if (!Array.isArray(parsed.fileChanges.create)) parsed.fileChanges.create = [];
      if (!Array.isArray(parsed.fileChanges.modify)) parsed.fileChanges.modify = [];
      if (!Array.isArray(parsed.fileChanges.delete)) parsed.fileChanges.delete = [];

      return parsed;
    } catch (error) {
      throw new Error(`Failed to generate solution: ${String(error)}`);
    }
  }

  /**
   * Generates Acceptance Criteria in BDD format
   */
  async generateAcceptanceCriteria(context: CodebaseContext): Promise<AcceptanceCriterion[]> {
    try {
      const systemPrompt = PromptTemplates.systemPrompt(context);
      // Use placeholder values - in real usage these would come from input
      const userPrompt = PromptTemplates.acceptanceCriteriaPrompt(
        'Feature specification',
        'Implementing a new feature in the codebase',
      );

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<AcceptanceCriterion[]>(response);

      // Validate array and structure
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Ensure all criteria have required fields
      return parsed
        .filter((ac) => ac.given && ac.when && ac.then)
        .slice(0, 15); // Limit to 15 criteria
    } catch (error) {
      throw new Error(`Failed to generate acceptance criteria: ${String(error)}`);
    }
  }

  /**
   * Generates clarification questions
   */
  async generateClarificationQuestions(context: CodebaseContext): Promise<ClarificationQuestion[]> {
    try {
      const systemPrompt = PromptTemplates.systemPrompt(context);
      const userPrompt = PromptTemplates.clarificationQuestionsPrompt(
        'Feature specification',
        'Implementing a new feature in the codebase',
      );

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<ClarificationQuestion[]>(response);

      // Validate: must be array or error
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Validate each question
      return parsed
        .filter(
          (q) =>
            q.id &&
            q.question &&
            q.type &&
            ['radio', 'checkbox', 'text', 'select', 'multiline'].includes(q.type),
        )
        .slice(0, 4); // Limit to 4 questions
    } catch (error) {
      // Clarification questions are optional - return empty array on error
      return [];
    }
  }

  /**
   * Generates file changes
   */
  async generateFileChanges(
    solution: SolutionSection,
    context: CodebaseContext,
  ): Promise<FileChange[]> {
    try {
      const directoryStructure = this.buildDirectoryStructure(context);
      const systemPrompt = PromptTemplates.systemPrompt(context);
      const userPrompt = PromptTemplates.fileChangesPrompt(
        solution.overview,
        directoryStructure,
      );

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<FileChange[]>(response);

      // Validate array
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Validate each file change
      return parsed
        .filter((fc) => fc.path && ['create', 'modify', 'delete'].includes(fc.action))
        .slice(0, 30); // Limit to 30 file changes
    } catch (error) {
      throw new Error(`Failed to generate file changes: ${String(error)}`);
    }
  }

  /**
   * Extracts API changes from deep analysis taskAnalysis if available
   */
  async extractApiChanges(context: CodebaseContext): Promise<ApiChanges | undefined> {
    const taskAnalysis = (context as any)?.taskAnalysis;
    if (taskAnalysis?.apiChanges) {
      const apiChanges = taskAnalysis.apiChanges;
      if (apiChanges.endpoints && Array.isArray(apiChanges.endpoints) && apiChanges.endpoints.length > 0) {
        return {
          endpoints: apiChanges.endpoints
            .filter((e: any) => e.method && e.route && e.description)
            .map((e: any) => ({
              method: e.method,
              route: e.route,
              controller: e.controller,
              dto: e.dto,
              description: e.description,
              authentication: e.authentication || 'none',
              status: e.status || 'new',
            })),
          baseUrl: apiChanges.baseUrl,
          middlewares: apiChanges.middlewares,
          rateLimiting: apiChanges.rateLimiting,
        };
      }
    }
    return undefined;
  }

  /**
   * Categorizes file changes by architectural layer
   */
  async categorizeFilesByLayer(
    fileChanges: FileChange[],
    context: CodebaseContext,
  ): Promise<LayeredFileChanges> {
    if (fileChanges.length === 0) {
      return { backend: [], frontend: [], shared: [], infrastructure: [], documentation: [] };
    }

    try {
      const directoryStructure = this.buildDirectoryStructure(context);
      const systemPrompt = PromptTemplates.systemPrompt(context);
      const userPrompt = PromptTemplates.layerCategorizationPrompt(fileChanges, directoryStructure);

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<LayeredFileChanges>(response);

      // Validate structure
      if (!parsed.backend || !parsed.frontend) {
        throw new Error('Invalid layer categorization structure');
      }

      return {
        backend: Array.isArray(parsed.backend) ? parsed.backend : [],
        frontend: Array.isArray(parsed.frontend) ? parsed.frontend : [],
        shared: Array.isArray(parsed.shared) ? parsed.shared : [],
        infrastructure: Array.isArray(parsed.infrastructure) ? parsed.infrastructure : [],
        documentation: Array.isArray(parsed.documentation) ? parsed.documentation : [],
      };
    } catch (error) {
      this.logger.warn(`Layer categorization failed, using fallback: ${String(error)}`);
      return this.fallbackCategorization(fileChanges);
    }
  }

  /**
   * Heuristic fallback for file layer categorization when LLM fails
   */
  private fallbackCategorization(fileChanges: FileChange[]): LayeredFileChanges {
    const result: LayeredFileChanges = {
      backend: [],
      frontend: [],
      shared: [],
      infrastructure: [],
      documentation: [],
    };

    for (const fc of fileChanges) {
      const path = fc.path.toLowerCase();
      if (path.endsWith('.md') || path.startsWith('docs/')) {
        result.documentation.push(fc);
      } else if (path.startsWith('.github/') || path.includes('docker') || path.includes('terraform') || path.includes('ci/')) {
        result.infrastructure.push(fc);
      } else if (path.startsWith('shared/') || path.startsWith('packages/') || path.includes('/shared/')) {
        result.shared.push(fc);
      } else if (path.startsWith('client/') || path.startsWith('frontend/') || path.endsWith('.tsx') || path.endsWith('.jsx')) {
        result.frontend.push(fc);
      } else if (path.startsWith('backend/') || path.startsWith('server/') || path.startsWith('api/') || path.endsWith('.controller.ts') || path.endsWith('.service.ts') || path.endsWith('.module.ts')) {
        result.backend.push(fc);
      } else {
        // Default: if it looks like backend code, put it there; otherwise shared
        result.backend.push(fc);
      }
    }

    return result;
  }

  /**
   * Generates a comprehensive test plan for the specification
   */
  async generateTestPlan(
    solution: SolutionSection,
    acceptanceCriteria: AcceptanceCriterion[],
    fileChanges: FileChange[],
    context: CodebaseContext,
  ): Promise<TestPlan | undefined> {
    try {
      const systemPrompt = PromptTemplates.systemPrompt(context);
      const userPrompt = PromptTemplates.testPlanPrompt(
        solution.overview,
        acceptanceCriteria,
        fileChanges,
      );

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<TestPlan>(response);

      // Validate minimum structure
      if (!parsed.summary || !Array.isArray(parsed.unitTests)) {
        throw new Error('Invalid test plan structure');
      }

      // Ensure arrays exist
      if (!Array.isArray(parsed.integrationTests)) parsed.integrationTests = [];
      if (!Array.isArray(parsed.edgeCases)) parsed.edgeCases = [];

      // Log warnings for low test counts
      if (parsed.unitTests.length < 5) this.logger.warn(`Test plan has only ${parsed.unitTests.length} unit tests (5+ recommended)`);
      if (parsed.integrationTests.length < 2) this.logger.warn(`Test plan has only ${parsed.integrationTests.length} integration tests (2+ recommended)`);
      if (parsed.edgeCases.length < 2) this.logger.warn(`Test plan has only ${parsed.edgeCases.length} edge cases (2+ recommended)`);

      return parsed;
    } catch (error) {
      this.logger.warn(`Test plan generation failed: ${String(error)}`);
      return undefined;
    }
  }

  /**
   * Generates scope items (in-scope or out-of-scope)
   */
  private async generateScope(title: string, description: string, inScope: boolean): Promise<string[]> {
    try {
      const scopeType = inScope ? 'in-scope' : 'out-of-scope';
      const prompt = `Based on this request, generate ${scopeType} items:

Title: ${title}
Description: ${description || '(No description)'}

Generate a JSON array of 3-5 ${scopeType} items (specific and actionable):
["item 1", "item 2", "item 3"]

IMPORTANT:
- Items must be specific and actionable (not vague)
- No overlap with ${inScope ? 'out' : 'in'}-of-scope items
- Valid JSON array only`;

      const response = await this.callLLM('You are a technical spec writer.', prompt);
      const parsed = this.parseJSON<string[]>(response);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.filter((item) => typeof item === 'string').slice(0, 10);
    } catch (error) {
      // Default scope if generation fails
      return inScope ? ['Feature implementation'] : [];
    }
  }

  /**
   * Resolve tech stack from LLM analysis with fingerprint fallback.
   * Treats "unknown"/"Unknown" as empty so fingerprint data is used instead.
   */
  private resolveStack(context: CodebaseContext): { language?: string; framework?: string; packageManager?: string } {
    const isKnown = (v: string | undefined | null): string | undefined =>
      v && v.toLowerCase() !== 'unknown' ? v : undefined;

    const llmLang = isKnown(context.stack?.language?.name);
    const llmFramework = isKnown(context.stack?.framework?.name);
    const llmPm = typeof context.stack?.packageManager === 'string'
      ? isKnown(context.stack.packageManager)
      : isKnown(context.stack?.packageManager?.type);

    const fp = context.taskAnalysis?.fingerprint;

    return {
      language: llmLang || isKnown(fp?.primaryLanguage) || undefined,
      framework: llmFramework || isKnown(fp?.frameworks?.[0]) || undefined,
      packageManager: llmPm || isKnown(fp?.packageManager) || undefined,
    };
  }

  /**
   * Detects ambiguities in the specification
   */
  private detectAmbiguities(spec: TechSpec): string[] {
    const flags: string[] = [];
    const textToCheck = [
      spec.problemStatement.narrative,
      spec.problemStatement.whyItMatters,
      spec.problemStatement.context,
      spec.solution.overview,
      ...spec.solution.steps.map((s) => s.description),
      ...spec.acceptanceCriteria.map((ac) => `${ac.given} ${ac.when} ${ac.then}`),
    ].join(' ');

    for (const marker of TechSpecGeneratorImpl.AMBIGUITY_MARKERS) {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = textToCheck.match(regex);
      if (matches && matches.length > 0) {
        flags.push(`Found "${marker}" (${matches.length} occurrences) - use definitive language`);
      }
    }

    return flags;
  }

  /**
   * Removes ambiguities from specification via LLM
   */
  private async removeAmbiguities(spec: TechSpec): Promise<void> {
    try {
      const ambiguousText = [
        spec.problemStatement.narrative,
        spec.problemStatement.whyItMatters,
        spec.solution.overview,
      ].join('\n\n');

      const prompt = `Rewrite this text to be completely definitive with zero ambiguity.
NO "or" statements - all decisions definitive.
NO "might", "could", "possibly" - use "will", "must", "shall".

Original text:
${ambiguousText}

Rewritten text (definitive, unambiguous):`;

      const response = await this.callLLM(
        'You are a technical writing expert specializing in zero-ambiguity specs.',
        prompt,
      );

      // Handle response (could be string or object)
      const rewritten = typeof response === 'string' ? response : JSON.stringify(response);

      // Apply rewritten text back to spec
      spec.problemStatement.narrative = rewritten.split('\n')[0] || spec.problemStatement.narrative;
      spec.ambiguityFlags = []; // Clear flags after rewriting
    } catch (error) {
      // If rewriting fails, keep original and leave flags
      console.error('Failed to remove ambiguities:', error);
    }
  }

  /**
   * Calculates quality score (0-100)
   *
   * Breakdown (rebalanced for Epic 20):
   * - Problem Statement (0-20): narrative, whyItMatters, context, assumptions, constraints
   * - Solution (0-25): steps count, file paths, line numbers, code snippets
   * - Acceptance Criteria (0-15): count, BDD format, testability, edge cases
   * - File Changes (0-10): paths specific, line numbers, imports, patterns
   * - Ambiguity (0-10): deduct for ambiguous language, reward for definitive
   * - Test Plan (0-10): comprehensive test coverage
   * - Layer Categorization (0-5): backend/frontend split clarity
   * - API Changes (0-5): endpoint documentation completeness
   */
  calculateQualityScore(spec: TechSpec): number {
    let score = 0;

    // Problem Statement (0-20)
    score += this.scoreProblemStatement(spec.problemStatement);

    // Solution (0-25)
    score += this.scoreSolution(spec.solution);

    // Acceptance Criteria (0-15)
    score += this.scoreAcceptanceCriteria(spec.acceptanceCriteria);

    // File Changes (0-10)
    score += this.scoreFileChanges(spec.fileChanges);

    // Ambiguity (0-10)
    score += this.scoreAmbiguity(spec);

    // Epic 20: Test Plan (0-10)
    if (spec.testPlan) score += this.scoreTestPlan(spec.testPlan);

    // Epic 20: Layer Categorization (0-5)
    if (spec.layeredFileChanges) score += this.scoreLayerCategorization(spec.layeredFileChanges);

    // Epic 20: API Changes (0-5)
    if (spec.apiChanges) score += this.scoreApiChanges(spec.apiChanges);

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Scores problem statement (0-20)
   */
  private scoreProblemStatement(ps: ProblemStatement): number {
    let score = 0;

    // narrative: 0-7
    if (ps.narrative && ps.narrative.length > 50) score += 7;
    else if (ps.narrative && ps.narrative.length > 30) score += 4;
    else if (ps.narrative) score += 2;

    // whyItMatters: 0-7
    if (ps.whyItMatters && ps.whyItMatters.length > 50) score += 7;
    else if (ps.whyItMatters && ps.whyItMatters.length > 30) score += 4;
    else if (ps.whyItMatters) score += 2;

    // context: 0-3
    if (ps.context && ps.context.length > 30) score += 3;
    else if (ps.context) score += 1;

    // assumptions: 0-2
    if (Array.isArray(ps.assumptions) && ps.assumptions.length >= 2) score += 2;
    else if (Array.isArray(ps.assumptions) && ps.assumptions.length === 1) score += 1;

    // constraints: 0-1
    if (Array.isArray(ps.constraints) && ps.constraints.length >= 2) score += 1;

    return score;
  }

  /**
   * Scores solution (0-25)
   */
  private scoreSolution(solution: SolutionSection): number {
    let score = 0;

    // steps count: 0-7
    const stepCount = Array.isArray(solution.steps) ? solution.steps.length : 0;
    if (stepCount >= 5) score += 7;
    else if (stepCount >= 3) score += 4;
    else if (stepCount > 0) score += 2;

    // file paths: 0-7
    const filesWithPaths = (solution.steps || []).filter((s) => s.file && s.file.includes('/'));
    if (filesWithPaths.length === stepCount && stepCount > 0) score += 7;
    else if (filesWithPaths.length / stepCount > 0.5) score += 4;
    else if (filesWithPaths.length > 0) score += 2;

    // line numbers: 0-6
    const filesWithLines = (solution.steps || []).filter((s) => s.lineNumbers);
    if (filesWithLines.length >= 3) score += 6;
    else if (filesWithLines.length >= 2) score += 4;
    else if (filesWithLines.length > 0) score += 2;

    // code snippets: 0-3
    const filesWithSnippets = (solution.steps || []).filter((s) => s.codeSnippet);
    if (filesWithSnippets.length >= 2) score += 3;
    else if (filesWithSnippets.length > 0) score += 1;

    // file changes: 0-2
    if (
      solution.fileChanges &&
      (solution.fileChanges.create?.length || 0) +
        (solution.fileChanges.modify?.length || 0) >
        0
    ) {
      score += 2;
    }

    return score;
  }

  /**
   * Scores acceptance criteria (0-15)
   */
  private scoreAcceptanceCriteria(criteria: AcceptanceCriterion[]): number {
    let score = 0;

    // count: 0-5
    const count = Array.isArray(criteria) ? criteria.length : 0;
    if (count >= 5) score += 5;
    else if (count >= 3) score += 3;
    else if (count > 0) score += 1;

    // BDD format: 0-5
    const validBDD = (criteria || []).filter((ac) => ac.given && ac.when && ac.then);
    if (validBDD.length === count && count > 0) score += 5;
    else if (validBDD.length / count > 0.7) score += 3;
    else if (validBDD.length > 0) score += 1;

    // testability: 0-3
    const withNotes = (criteria || []).filter((ac) => ac.implementationNotes);
    if (withNotes.length === count && count > 0) score += 3;
    else if (withNotes.length / count > 0.5) score += 2;
    else if (withNotes.length > 0) score += 1;

    // edge cases: 0-2
    const hasEdgeCase = (criteria || []).some(
      (ac) =>
        ac.implementationNotes?.toLowerCase().includes('error') ||
        ac.implementationNotes?.toLowerCase().includes('edge') ||
        ac.then?.toLowerCase().includes('fail'),
    );
    if (hasEdgeCase) score += 2;

    return score;
  }

  /**
   * Scores file changes (0-10)
   */
  private scoreFileChanges(fileChanges: FileChange[]): number {
    let score = 0;

    const count = Array.isArray(fileChanges) ? fileChanges.length : 0;

    // paths specific: 0-4
    const withValidPaths = (fileChanges || []).filter((fc) => fc.path && fc.path.includes('/'));
    if (withValidPaths.length === count && count > 0) score += 4;
    else if (withValidPaths.length / count > 0.7) score += 2;
    else if (withValidPaths.length > 0) score += 1;

    // line numbers: 0-3
    const modifyChanges = (fileChanges || []).filter((fc) => fc.action === 'modify');
    const withLineNumbers = modifyChanges.filter((fc) => fc.lineNumbers);
    if (modifyChanges.length > 0) {
      if (withLineNumbers.length === modifyChanges.length) score += 3;
      else if (withLineNumbers.length / modifyChanges.length > 0.5) score += 2;
      else if (withLineNumbers.length > 0) score += 1;
    } else if (count > 0) {
      score += 1; // Creates don't need line numbers
    }

    // imports: 0-2
    const withImports = (fileChanges || []).filter((fc) => fc.imports);
    if (withImports.length > 0) score += 2;
    else if (count > 0) score += 1;

    // patterns: 0-1
    const withPattern = (fileChanges || []).filter((fc) => fc.pattern);
    if (withPattern.length > 0) score += 1;

    return score;
  }

  /**
   * Scores ambiguity (0-10)
   */
  private scoreAmbiguity(spec: TechSpec): number {
    let score = 10; // Start with full points

    // Deduct for ambiguity flags
    score -= (spec.ambiguityFlags?.length || 0) * 2;

    // Deduct for ambiguity markers in text
    const allText = [
      spec.problemStatement.narrative,
      spec.solution.overview,
    ].join(' ');

    for (const marker of TechSpecGeneratorImpl.AMBIGUITY_MARKERS) {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = allText.match(regex);
      if (matches) score -= matches.length;
    }

    // Bonus for definitive markers
    for (const marker of TechSpecGeneratorImpl.DEFINITIVE_MARKERS) {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = allText.match(regex);
      if (matches && matches.length > 2) score += 1;
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Scores test plan (0-10)
   */
  private scoreTestPlan(testPlan: TestPlan): number {
    let score = 0;

    if (testPlan.summary && testPlan.summary.length > 30) score += 2;

    if (testPlan.unitTests?.length >= 5) score += 4;
    else if (testPlan.unitTests?.length >= 3) score += 2;

    if (testPlan.integrationTests?.length >= 2) score += 2;
    else if (testPlan.integrationTests?.length >= 1) score += 1;

    if (testPlan.edgeCases?.length >= 2) score += 2;
    else if (testPlan.edgeCases?.length >= 1) score += 1;

    return score;
  }

  /**
   * Scores layer categorization (0-5)
   */
  private scoreLayerCategorization(layers: LayeredFileChanges): number {
    let score = 0;
    const totalFiles = (layers.backend?.length || 0) + (layers.frontend?.length || 0) +
      (layers.shared?.length || 0) + (layers.infrastructure?.length || 0) + (layers.documentation?.length || 0);

    if (totalFiles > 0) score += 3;
    if ((layers.backend?.length || 0) > 0 && (layers.frontend?.length || 0) > 0) score += 2;

    return score;
  }

  /**
   * Scores API changes (0-5)
   */
  private scoreApiChanges(apiChanges: ApiChanges): number {
    let score = 0;

    if (apiChanges.endpoints?.length >= 3) score += 3;
    else if (apiChanges.endpoints?.length >= 1) score += 2;

    const withDtos = apiChanges.endpoints?.filter(e => e.dto?.request || e.dto?.response).length || 0;
    if (withDtos === apiChanges.endpoints?.length && apiChanges.endpoints?.length > 0) score += 2;

    return score;
  }

  /**
   * Calls LLM with system and user prompts
   *
   * Uses configured provider (Ollama or Anthropic) via Vercel AI SDK.
   * Falls back to mock responses when no model is configured.
   */
  private async callLLM(systemPrompt: string, userPrompt: string): Promise<any> {
    if (!this.llmModel) {
      throw new Error('No LLM configured. Set LLM_PROVIDER and ANTHROPIC_API_KEY in .env');
    }

    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = attempt === 1
          ? userPrompt
          : `${userPrompt}\n\nIMPORTANT: You MUST respond with ONLY valid JSON. No text, no explanations, no apologies. Start your response with { or [.`;

        const { text } = await generateText({
          model: this.llmModel,
          system: systemPrompt,
          prompt,
          maxOutputTokens: 4096,
          temperature: 0.2,
        });

        this.logger.debug(`LLM response (${this.providerName}): ${text.length} chars`);
        return this.parseJSON(text);
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries && error.message?.includes('Failed to parse response')) {
          this.logger.warn(`LLM returned non-JSON (attempt ${attempt}/${maxRetries}), retrying...`);
          continue;
        }
        this.logger.error(`LLM call failed (${this.providerName}): ${error.message}`);
        throw new Error(`LLM call failed: ${error.message}`);
      }
    }

    throw new Error(`LLM call failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Generates mock LLM response for testing
   *
   * Used when llmClient is not available or for testing purposes
   */
  private generateMockResponse(prompt: string): any {
    // Check more specific prompts first, then fall back to general ones

    if (prompt.toLowerCase().includes('problem statement')) {
      return {
        narrative: 'The system needs to generate technical specifications with zero ambiguity.',
        whyItMatters:
          'Technical specifications must be definitive to prevent implementation errors and misalignment.',
        context: 'The project uses a clean architecture with TypeScript and Jest testing.',
        assumptions: [
          'LLM API is available and responsive',
          'Codebase context is provided',
        ],
        constraints: [
          '30-second timeout per LLM call',
          'Token limit of 4000 per request',
        ],
      };
    }

    if (prompt.toLowerCase().includes('identify all files')) {
      // File changes prompt - MUST return array
      return [
        {
          path: 'backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts',
          action: 'create',
          suggestedContent: 'Domain interfaces and types',
          imports: { add: [] },
          pattern: 'Follow existing domain interface patterns',
        },
      ];
    }

    if (prompt.toLowerCase().includes('solution')) {
      return {
        overview:
          'Implement a tech spec generator service with LLM integration and context injection.',
        steps: [
          {
            order: 1,
            description: 'Create domain interfaces for technical specifications',
            file: 'backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts',
            lineNumbers: [1, 50],
            codeSnippet: 'export interface TechSpec { ... }',
          },
        ],
        fileChanges: {
          create: [
            'backend/src/tickets/domain/tech-spec/TechSpecGenerator.ts',
            'backend/src/tickets/application/services/TechSpecGeneratorImpl.ts',
          ],
          modify: [],
          delete: [],
        },
      };
    }

    if (prompt.toLowerCase().includes('acceptance criteria')) {
      return [
        {
          given: 'User provides title and description',
          when: 'Generator is called with valid input',
          then: 'Complete tech spec is generated with all sections',
          implementationNotes: 'Test with various input combinations',
        },
      ];
    }

    if (prompt.toLowerCase().includes('ambiguities') || prompt.toLowerCase().includes('ambiguity')) {
      return [];
    }

    // Default for scope generation or unknown - return array
    return ['Feature implementation', 'Integration with existing services'];
  }

  /**
   * Parses JSON response from LLM
   *
   * Handles both string and object responses
   */
  private parseJSON<T>(response: any): T {
    try {
      // If already an object, return it
      if (typeof response === 'object' && response !== null) {
        return response as T;
      }

      // If string, parse it
      if (typeof response === 'string') {
        // Strip markdown fences
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        // Extract JSON from response if wrapped in text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

        // Try parsing directly first
        try {
          return JSON.parse(jsonStr);
        } catch {
          // Sanitize: replace backtick-wrapped values with double-quoted strings
          // LLMs sometimes use `...` instead of "..." for string values
          const sanitized = jsonStr.replace(
            /:\s*`([^`]*)`/g,
            (_, content) => `: ${JSON.stringify(content)}`,
          );
          try {
            return JSON.parse(sanitized);
          } catch {
            // Last resort: try to fix common LLM JSON issues
            // Remove trailing commas before } or ]
            const fixedTrailing = sanitized
              .replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(fixedTrailing);
          }
        }
      }

      throw new Error('Response is not a string or object');
    } catch (error) {
      throw new Error(`Failed to parse response: ${String(error)}`);
    }
  }

  /**
   * Builds directory structure string for context
   */
  private buildDirectoryStructure(context: CodebaseContext): string {
    const dirs = new Set<string>();

    // Extract directories from file paths
    context.files.forEach((_, path) => {
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    });

    // Add detected important directories
    if (context.analysis.directories && context.analysis.directories.length > 0) {
      context.analysis.directories.forEach((d) => dirs.add(d.path));
    }

    // Sort and limit
    return Array.from(dirs)
      .sort()
      .slice(0, 20)
      .join('\n');
  }

  /**
   * Generates clarification questions with context from prior rounds
   *
   * Used in iterative refinement workflow for Rounds 1, 2, and 3.
   * Returns dynamic number of questions based on round and prior answers.
   */
  async generateQuestionsWithContext(input: {
    title: string;
    description?: string;
    context: CodebaseContext;
    priorAnswers: Array<{ questionId: string; answer: string | string[] }>;
    roundNumber: number;
  }): Promise<ClarificationQuestion[]> {
    try {
      const systemPrompt = PromptTemplates.systemPrompt(input.context);
      const userPrompt = this.buildQuestionsWithContextPrompt(
        input.title,
        input.description,
        input.roundNumber,
        input.priorAnswers,
      );

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<ClarificationQuestion[]>(response);

      // Validate: must be array
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Validate each question and limit by round (10 for Round 1, 3 for later rounds)
      return parsed
        .filter(
          (q) =>
            q.id &&
            q.question &&
            q.type &&
            ['radio', 'checkbox', 'text', 'select', 'multiline'].includes(q.type),
        )
        .slice(0, input.roundNumber === 1 ? 10 : 3); // Front-load questions: Round 1 up to 10, Rounds 2-3 up to 3
    } catch (error) {
      throw new Error(`Failed to generate questions with context: ${String(error)}`);
    }
  }

  /**
   * Determines if more clarification questions are needed
   *
   * Evaluates accumulated answers to decide if sufficient context exists
   * to generate a definitive technical specification.
   * Hard stop at round 3 - always returns false when currentRound >= 3.
   */
  async shouldAskMoreQuestions(input: {
    title: string;
    description?: string;
    context: CodebaseContext;
    answeredQuestions: Array<{ questionId: string; answer: string | string[] }>;
    currentRound: number;
  }): Promise<boolean> {
    try {
      // Hard stop at round 3
      if (input.currentRound >= 3) {
        return false;
      }

      const systemPrompt = PromptTemplates.systemPrompt(input.context);
      const userPrompt = this.buildShouldAskMorePrompt(
        input.title,
        input.description,
        input.answeredQuestions,
        input.currentRound,
      );

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<{ shouldAskMore: boolean; confidence: number; reasoning: string }>(
        response,
      );

      // Validate structure
      if (typeof parsed.shouldAskMore !== 'boolean') {
        throw new Error('Response missing shouldAskMore boolean');
      }

      return parsed.shouldAskMore;
    } catch (error) {
      console.error('Failed to determine if more questions needed, defaulting to false:', error);
      // On failure, default to false (finalize) - safer than asking again
      return false;
    }
  }

  /**
   * Generates final technical specification with accumulated answers
   *
   * More definitive than initial generate() because it incorporates
   * answers to clarification questions from all rounds.
   */
  async generateWithAnswers(input: {
    title: string;
    description?: string;
    context: CodebaseContext;
    answers: Array<{ questionId: string; answer: string | string[] }>;
  }): Promise<TechSpec> {
    try {
      const context: CodebaseContext = input.context;

      // Generate each section with answer context
      const problemStatement = await this.generateProblemStatementWithAnswers(
        input.title,
        input.description || '',
        context,
        input.answers,
      );

      const solution = await this.generateSolution(problemStatement, context);

      const [acceptanceCriteria, fileChanges, inScope, outOfScope, apiChanges] = await Promise.all([
        this.generateAcceptanceCriteriaWithAnswers(context, input.answers),
        this.generateFileChanges(solution, context),
        this.generateScope(input.title, input.description || '', true),
        this.generateScope(input.title, input.description || '', false),
        this.extractApiChanges(context),
      ]);

      // Generate sections that depend on fileChanges (parallel)
      const [testPlan, layeredFileChanges] = await Promise.all([
        this.generateTestPlan(solution, acceptanceCriteria, fileChanges, input.context),
        this.categorizeFilesByLayer(fileChanges, input.context),
      ]);

      // Assemble final tech spec
      const techSpec: TechSpec = {
        id: randomUUID(),
        title: input.title,
        createdAt: new Date(),
        problemStatement,
        solution,
        inScope,
        outOfScope,
        acceptanceCriteria,
        clarificationQuestions: [], // No more clarification needed
        fileChanges,
        qualityScore: 0,
        ambiguityFlags: [],
        stack: this.resolveStack(context),
        apiChanges,
        layeredFileChanges,
        testPlan,
      };

      // Detect and remove remaining ambiguities
      techSpec.ambiguityFlags = this.detectAmbiguities(techSpec);
      if (techSpec.ambiguityFlags.length > 0) {
        await this.removeAmbiguities(techSpec);
      }

      // Calculate quality score
      techSpec.qualityScore = this.calculateQualityScore(techSpec);

      return techSpec;
    } catch (error) {
      throw new Error(`Failed to generate spec with answers: ${String(error)}`);
    }
  }

  /**
   * Builds prompt for generating questions with context from prior rounds
   */
  private buildQuestionsWithContextPrompt(
    title: string,
    description: string | undefined,
    roundNumber: number,
    priorAnswers: Array<{ questionId: string; answer: string | string[] }>,
  ): string {
    const priorAnswersText =
      priorAnswers.length > 0
        ? `Previous Answers:\n${priorAnswers.map((a) => `- Q${a.questionId}: ${JSON.stringify(a.answer)}`).join('\n')}\n\n`
        : '';

    if (roundNumber === 1) {
      return `Analyze this request to identify key questions that need clarification.

Title: ${title}
Description: ${description || '(No description)'}

Generate 0-10 clarification questions. Focus on questions for:
- Product owners, project managers, and stakeholders (non-technical language)
- NOT implementation details or library choices
- User experience and behavior
- Business rules and scope
- Success criteria and edge cases

Each question must:
- Have a unique id (q1, q2, q3, etc.)
- Use clear, non-technical language
- Explain WHY you're asking (context field)
- Explain HOW the answer affects the user experience or scope (impact field)
- Use appropriate type (radio, checkbox, text, select, multiline)
- Be focused on reducing critical ambiguities

Example good questions (non-technical):
- "Who will primarily use this feature?" (user perspective)
- "Should users see an error message if [action] fails?" (UX decision)
- "What should happen when [edge case occurs]?" (behavior)

Example bad questions (too technical):
- "Which database should we use?" → Skip this
- "What authentication mechanism?" → Skip this
- "Which component library?" → Skip this

Return empty array [] if NO ambiguities exist about user experience, scope, or success criteria.

Generate valid JSON array:
[
  {
    "id": "q1",
    "question": "Question phrased for non-technical stakeholders",
    "type": "radio|checkbox|text|select|multiline",
    "options": ["option 1", "option 2"],
    "context": "Why we need to know this from a UX/scope perspective",
    "impact": "How this clarifies the user experience or success criteria"
  }
]`;
    }

    // Rounds 2 and 3: Generate targeted follow-ups OR empty array
    return `Re-analyze with answers from previous round.

Title: ${title}
Description: ${description || '(No description)'}

${priorAnswersText}
Current Round: ${roundNumber}

Based on previous answers, generate 1-3 targeted follow-up questions OR return empty array [] if sufficient info gathered.

Return valid JSON array (can be empty):
[
  {
    "id": "q4",
    "question": "Follow-up question addressing gaps",
    "type": "radio|checkbox|text|select|multiline",
    "options": ["option 1"],
    "context": "Why we need clarification on this point",
    "impact": "How this refines the specification"
  }
]

Return [] if:
- All critical ambiguities already resolved
- Acceptance criteria can be specific without more info
- File changes are deterministic with current answers`;
  }

  /**
   * Builds prompt for deciding if more questions are needed
   */
  private buildShouldAskMorePrompt(
    title: string,
    description: string | undefined,
    answeredQuestions: Array<{ questionId: string; answer: string | string[] }>,
    currentRound: number,
  ): string {
    const answersText = answeredQuestions
      .map((a) => `- Q${a.questionId}: ${JSON.stringify(a.answer)}`)
      .join('\n');

    return `Evaluate if we have sufficient information to generate a definitive technical specification.

Title: ${title}
Description: ${description || '(No description)'}

Answered Questions:
${answersText}

Current Round: ${currentRound}/3

Assess:
1. Can we determine core user experience and behavior?
2. Are critical business rules clear?
3. Are success criteria definable?
4. Can we identify all affected code areas?

Return valid JSON:
{
  "shouldAskMore": boolean,
  "confidence": 0-100,
  "reasoning": "Brief explanation of decision"
}

CRITICAL: Only request another round if you CANNOT determine:
1. Core user experience and behavior
2. Critical business rules
3. Success criteria and edge cases
4. Which code areas need modification

Be conservative: When in doubt, finalize.
Prefer letting developers ask during implementation over endless clarification rounds.

Guidelines:
- shouldAskMore=true ONLY if current answers leave critical ambiguity
- shouldAskMore=false if we can write an adequate spec with current info
- Always return false for round 3+ (hard limit)
- Default to false when uncertain`;
  }

  /**
   * Generates problem statement with answer context
   */
  private async generateProblemStatementWithAnswers(
    title: string,
    description: string,
    context: CodebaseContext,
    answers: Array<{ questionId: string; answer: string | string[] }>,
  ): Promise<ProblemStatement> {
    try {
      const systemPrompt = PromptTemplates.systemPrompt(context);
      const answersText = answers
        .map((a) => `- Q${a.questionId}: ${JSON.stringify(a.answer)}`)
        .join('\n');

      const userPrompt = `Based on user clarifications, generate an enhanced problem statement.

Title: ${title}
Description: ${description}

User Clarifications:
${answersText}

Use these answers to make the problem statement more specific and grounded.

Generate valid JSON object:
{
  "narrative": "Clear, specific explanation informed by user answers",
  "whyItMatters": "Impact and business value",
  "context": "Relevant background with answer context",
  "assumptions": ["assumption 1", "assumption 2"],
  "constraints": ["constraint 1", "constraint 2"]
}`;

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<any>(response);

      return this.normalizeProblemStatement(parsed, title, description);
    } catch (error) {
      throw new Error(`Failed to generate problem statement with answers: ${String(error)}`);
    }
  }

  /**
   * Generates acceptance criteria with answer context
   */
  private async generateAcceptanceCriteriaWithAnswers(
    context: CodebaseContext,
    answers: Array<{ questionId: string; answer: string | string[] }>,
  ): Promise<AcceptanceCriterion[]> {
    try {
      const systemPrompt = PromptTemplates.systemPrompt(context);
      const answersText = answers
        .map((a) => `- Q${a.questionId}: ${JSON.stringify(a.answer)}`)
        .join('\n');

      const userPrompt = `Generate 5+ acceptance criteria informed by user clarifications.

User Answers:
${answersText}

Create specific, testable criteria in Given/When/Then format.
Use answer details to make criteria concrete and deterministic.

Generate valid JSON array:
[
  {
    "given": "Initial condition from user clarifications",
    "when": "Action or trigger",
    "then": "Expected result (specific per answers)",
    "implementationNotes": "How to test/implement this criterion"
  }
]`;

      const response = await this.callLLM(systemPrompt, userPrompt);
      const parsed = this.parseJSON<AcceptanceCriterion[]>(response);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed
        .filter((ac) => ac.given && ac.when && ac.then)
        .slice(0, 15);
    } catch (error) {
      throw new Error(`Failed to generate acceptance criteria with answers: ${String(error)}`);
    }
  }
}
