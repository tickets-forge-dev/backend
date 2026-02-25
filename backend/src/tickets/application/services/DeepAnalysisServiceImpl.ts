/**
 * DeepAnalysisServiceImpl — 3-phase LLM pipeline for repository analysis
 *
 * Replaces regex-based ProjectStackDetector + CodebaseAnalyzer.
 * The LLM handles ALL detection and analysis.
 *
 * Phase 1: Tree + config read (already done by controller, passed as input)
 * Phase 2: LLM selects which source files to read for the task
 * Phase 3: LLM performs deep analysis with all file contents
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import {
  DeepAnalysisService,
  DeepAnalysisInput,
  FileTree,
  AnalysisProgressEvent,
} from '@tickets/domain/deep-analysis/deep-analysis.service';
import { DeepAnalysisResult } from '@tickets/domain/deep-analysis/deep-analysis.types';
import {
  RepositoryFingerprintService,
  RepositoryFingerprint,
} from './RepositoryFingerprintService';
import { ApiDetectionService } from './ApiDetectionService';

/** Directories to always exclude from the tree the LLM sees */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.next',
  '.nuxt',
  'build',
  'coverage',
  '.turbo',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
  '.bmad', // BMAD workflow configs — never relevant to app code
  '.github', // CI/CD workflows
  '.vscode',
  '.idea',
]);

/** File extensions to skip (binary, generated, non-source) */
const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.lock',
  '.map',
  '.min.js',
  '.min.css',
  '.d.ts',
]);

/** Max files the LLM can request to read */
const MAX_FILES_TO_READ = 25;

/** Max lines per file content to send to LLM */
const MAX_LINES_PER_FILE = 120;

/** Parallel batch size for GitHub file reads */
const FILE_READ_BATCH_SIZE = 5;

/** Max file size in bytes before skipping */
const MAX_FILE_SIZE_BYTES = 50_000;

@Injectable()
export class DeepAnalysisServiceImpl implements DeepAnalysisService {
  private readonly logger = new Logger(DeepAnalysisServiceImpl.name);
  private readonly llmModel: LanguageModel | null;
  private readonly providerName: string;

  constructor(
    private configService: ConfigService,
    private fingerprintService: RepositoryFingerprintService,
    private apiDetectionService: ApiDetectionService,
  ) {
    const provider = this.configService.get<string>('LLM_PROVIDER') || 'anthropic';

    if (provider === 'anthropic') {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      const modelId =
        this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-haiku-20240307';
      if (apiKey) {
        const anthropic = createAnthropic({ apiKey });
        this.llmModel = anthropic(modelId);
        this.providerName = `Anthropic (${modelId})`;
      } else {
        this.llmModel = null;
        this.providerName = 'none (ANTHROPIC_API_KEY not set)';
      }
    } else {
      // Fallback: require Anthropic
      this.llmModel = null;
      this.providerName = 'none (LLM_PROVIDER must be anthropic)';
    }

    this.logger.log(`DeepAnalysis LLM ready: ${this.providerName}`);
  }

  /**
   * Run full 3-phase deep analysis with 2-pass fingerprinting for speed
   *
   * Pass 1 (fast): Extract fingerprint without reading file contents
   * Pass 2 (detailed): Select and read relevant files, then full analysis
   */
  async analyze(input: DeepAnalysisInput): Promise<DeepAnalysisResult> {
    const startTime = Date.now();
    const emit = (event: AnalysisProgressEvent) => input.onProgress?.(event);

    this.logger.log(`Starting deep analysis for ${input.owner}/${input.repo} — "${input.title}"`);

    // Phase 1: Build condensed tree (input already has tree + configs)
    const condensedTree = this.buildFileTreeString(input.fileTree);
    const configContents = this.buildConfigContents(input.configFiles);

    this.logger.log(`Phase 1: Tree has ${condensedTree.split('\n').length} source entries`);

    // PASS 1: Fast fingerprinting (1-2 seconds)
    // Emit to frontend immediately so user sees tech stack right away
    emit({ phase: 'fingerprinting', message: 'Detecting tech stack...', percent: 15 });
    const fingerprint = this.fingerprintService.extractFingerprint(
      input.fileTree,
      Object.fromEntries(input.configFiles),
    );
    const pmDisplay = fingerprint.packageManager || 'auto-detect';
    this.logger.log(
      `Pass 1: Detected ${fingerprint.languages.join(', ') || 'unknown'} (${pmDisplay})`,
    );

    // Emit fingerprint result quickly (can be used by frontend immediately)
    emit({
      phase: 'fingerprinting',
      message: `Detected: ${fingerprint.primaryLanguage}, ${fingerprint.frameworks.join(', ') || 'no framework'}`,
      percent: 20,
    });

    // Phase 2: LLM selects files to read
    let selectedFiles: string[] = [];
    let fileContents = new Map<string, string>();

    try {
      emit({
        phase: 'selecting_files',
        message: 'AI is selecting relevant files to analyze...',
        percent: 35,
      });

      selectedFiles = await this.selectFilesToRead(
        input.title,
        input.description,
        condensedTree,
        configContents,
        input.fileTree,
      );

      this.logger.log(`Phase 2: LLM selected ${selectedFiles.length} files to read`);

      emit({
        phase: 'reading_files',
        message: `Reading ${selectedFiles.length} source files from GitHub...`,
        percent: 50,
      });

      // Read selected files from GitHub
      fileContents = await this.readFilesFromGitHub(
        input.octokit,
        input.owner,
        input.repo,
        input.branch,
        selectedFiles,
      );

      this.logger.log(`Phase 2: Read ${fileContents.size} files from GitHub`);
    } catch (error: any) {
      this.logger.warn(
        `Phase 2 file selection failed: ${error.message}. Proceeding with config files only.`,
      );
    }

    // Phase 3: LLM deep analysis with fingerprint context
    try {
      emit({
        phase: 'analyzing',
        message: 'Deep analyzing codebase patterns and architecture...',
        percent: 65,
      });

      const result = await this.analyzeWithLLM(
        input.title,
        input.description,
        configContents,
        fileContents,
        condensedTree,
        selectedFiles,
        fingerprint, // Pass fingerprint for context
      );

      // Post-Phase 3: Enrich with regex-based controller scanning
      // Uses files already read in Phase 2 — no extra GitHub API calls
      if (fileContents.size > 0) {
        try {
          const codebaseApis = this.apiDetectionService.detectApisFromFileContents(fileContents);
          if (codebaseApis.length > 0) {
            // Ensure taskAnalysis and apiChanges exist
            if (!result.taskAnalysis) result.taskAnalysis = {} as any;
            const ta = result.taskAnalysis!;
            if (!ta.apiChanges) ta.apiChanges = { endpoints: [] };
            // Tag existing codebase APIs so frontend can distinguish source
            ta.apiChanges.codebaseApis = codebaseApis.map((api) => ({
              method: api.method,
              route: api.path,
              controller: api.sourceFile,
              description: api.description,
              status: 'existing' as const,
              authentication: 'none' as const,
            }));
            this.logger.log(
              `Post-Phase 3: Found ${codebaseApis.length} APIs from controller scanning`,
            );
          }
        } catch (scanErr: any) {
          this.logger.warn(`Controller scan failed (non-critical): ${scanErr.message}`);
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`Deep analysis complete in ${elapsed}s`);

      return result;
    } catch (error: any) {
      this.logger.error(`Phase 3 analysis failed: ${error.message}. Returning degraded result.`);
      return this.buildDegradedResult(input.fileTree);
    }
  }

  // ==========================================================================
  // Phase 2: LLM File Selection
  // ==========================================================================

  private async selectFilesToRead(
    title: string,
    description: string | undefined,
    condensedTree: string,
    configContents: string,
    fileTree: FileTree,
  ): Promise<string[]> {
    const systemPrompt = `You are a senior software engineer. Your job: given a specific development task, pick the exact source files from the repository that are DIRECTLY relevant to implementing that task.

You must think like a developer who is about to start coding:
- Which files will I need to MODIFY?
- Which files show the PATTERNS I should follow?
- Which files contain the EXISTING code I need to integrate with?
- Which config files affect this feature?

DO NOT pick random files. Every file you pick must have a clear connection to the task.`;

    const userPrompt = `THE TASK: "${title}"
${description ? `DETAILS: ${description}` : ''}

EXISTING DEPENDENCIES AND CONFIG:
${configContents}

ALL SOURCE FILES IN THE REPOSITORY:
${condensedTree}

Think step by step:
1. What does this task require? (e.g., "add auth" = auth guards, login routes, user model, token handling, middleware, config)
2. Which files in the tree are related to those concerns?
3. Which files show patterns to follow? (e.g., existing guards, existing services, existing routes)
4. Are there existing implementations of similar features I should understand first?

Return a JSON array of 10-20 files. Each file must explain WHY it's relevant to "${title}":

[
  { "path": "exact/path/from/tree.ts", "why": "Contains existing auth guard pattern to follow" }
]

CRITICAL RULES:
- Every path MUST exist in the file tree above (copy-paste exact paths)
- Every "why" must reference the task "${title}" specifically — no generic reasons
- Skip test files, spec files, and mock files unless they test the exact feature area
- Skip documentation, CI/CD, workflow, and build config files
- Focus on APPLICATION CODE: routes, controllers, services, models, middleware, stores, components`;

    const response = await this.callLLM(systemPrompt, userPrompt);
    const parsed = this.parseJSON<Array<{ path: string; why: string }>>(response);

    if (!Array.isArray(parsed)) {
      throw new Error('File selection response is not an array');
    }

    // Validate paths exist in tree
    const treePaths = new Set(fileTree.tree.map((e) => e.path));
    const validFiles = parsed
      .filter((f) => f.path && treePaths.has(f.path))
      .slice(0, MAX_FILES_TO_READ)
      .map((f) => f.path);

    this.logger.debug(`File selection: ${validFiles.length} valid of ${parsed.length} requested`);

    return validFiles;
  }

  // ==========================================================================
  // File Reading (GitHub API)
  // ==========================================================================

  private async readFilesFromGitHub(
    octokit: any,
    owner: string,
    repo: string,
    branch: string,
    filePaths: string[],
  ): Promise<Map<string, string>> {
    const fileContents = new Map<string, string>();

    // Read in parallel batches
    for (let i = 0; i < filePaths.length; i += FILE_READ_BATCH_SIZE) {
      const batch = filePaths.slice(i, i + FILE_READ_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (filePath) => {
          try {
            const response = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: filePath,
              ref: branch,
            });

            if ('content' in response.data && typeof response.data.content === 'string') {
              if (response.data.size && response.data.size > MAX_FILE_SIZE_BYTES) {
                return { path: filePath, content: null };
              }

              const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
              const lines = content.split('\n');
              const truncated =
                lines.length > MAX_LINES_PER_FILE
                  ? lines.slice(0, MAX_LINES_PER_FILE).join('\n') +
                    `\n// ... truncated (${lines.length} total lines)`
                  : content;

              return { path: filePath, content: truncated };
            }
            return { path: filePath, content: null };
          } catch {
            return { path: filePath, content: null };
          }
        }),
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.content) {
          fileContents.set(result.value.path, result.value.content);
        }
      }
    }

    return fileContents;
  }

  // ==========================================================================
  // Phase 3: LLM Deep Analysis
  // ==========================================================================

  private async analyzeWithLLM(
    title: string,
    description: string | undefined,
    configContents: string,
    fileContents: Map<string, string>,
    condensedTree: string,
    llmFilesRead: string[],
    fingerprint?: RepositoryFingerprint,
  ): Promise<DeepAnalysisResult> {
    // Build file contents string
    const sourceFilesText = Array.from(fileContents.entries())
      .map(([path, content]) => `=== FILE: ${path} ===\n${content}`)
      .join('\n\n');

    const systemPrompt = `You are a senior software architect performing a deep code review to prepare for a specific development task. You have read the repository's source files. Your analysis must be ACTIONABLE — a developer reading your output should know exactly what to do, what to watch out for, and what patterns to follow.

CRITICAL: Your analysis must be specific to the task "${title}". Generic observations are useless. Every recommendation must be grounded in the actual code you've read.

Return ONLY valid JSON. No markdown fences, no explanation text.`;

    // Build fingerprint context for quick reference
    const fingerprintContext = fingerprint
      ? `
REPOSITORY FINGERPRINT (detected without reading all files):
- Languages: ${fingerprint.languages.join(', ') || 'unknown'}
- Primary: ${fingerprint.primaryLanguage}
- Frameworks: ${fingerprint.frameworks.join(', ') || 'none'}
- Package Manager: ${fingerprint.packageManager || 'unknown'}
- Key Config Files: ${Object.keys(fingerprint.configFiles).join(', ') || 'none'}
`
      : '';

    const userPrompt = `TASK: "${title}"
${description ? `DESCRIPTION: ${description}` : ''}

I've analyzed this repository and read selected source files. Analyze them for implementing the task above.
${fingerprintContext}

DEPENDENCIES & CONFIG:
${configContents}

SOURCE CODE I'VE READ:
${sourceFilesText || '(No source files available — analyze based on config and tree only)'}

REPOSITORY STRUCTURE:
${condensedTree}

Based on the ACTUAL CODE above, return this JSON:

{
  "stack": {
    "framework": { "name": "e.g. NestJS", "version": "from package.json" } or null,
    "language": { "name": "e.g. TypeScript" },
    "packageManager": { "type": "npm|yarn|pnpm|bun" },
    "buildTools": ["e.g. webpack, tsc, vite"],
    "dependencies": ["list 5-10 KEY runtime deps from package.json relevant to the task"],
    "devDependencies": ["list 3-5 KEY dev deps"]
  },

  "analysis": {
    "architecture": { "type": "describe the actual architecture pattern you see in the code", "confidence": 70-100 },
    "naming": { "files": "observed file naming pattern", "variables": "observed var naming", "classes": "observed class naming" },
    "testing": { "runner": "from devDependencies or test files", "location": "where tests live", "namingPattern": "e.g. *.spec.ts" },
    "stateManagement": { "type": "from code: zustand, redux, etc" } or null,
    "apiRouting": { "type": "from code: NestJS controllers, Express routes, etc" } or null,
    "directories": [
      { "path": "src/auth", "description": "Authentication module" },
      { "path": "src/shared/guards", "description": "Route guards" }
    ]
  },

  "files": [
    ONLY list files that are DIRECTLY relevant to "${title}".
    Each file: { "path": "exact path", "name": "filename", "isDirectory": false }
    These should be files a developer would open first when starting this task.
    Max 15 files.
  ],

  "taskAnalysis": {
    "filesToModify": [
      For each file that needs changes for "${title}", explain:
      { "path": "exact/path.ts", "reason": "Why this file needs changes for this task", "currentPurpose": "What this file does now", "suggestedChanges": "Specific changes: add X method, import Y, modify Z function" }
    ],
    "filesToCreate": [
      New files needed: { "path": "where/to/create.ts", "reason": "What this new file will do", "patternToFollow": "existing/file.ts that shows the pattern to copy" }
    ],
    "relevantPatterns": [
      Patterns from the codebase to follow: { "name": "e.g. Guard Pattern", "exampleFile": "path/to/example.ts", "description": "How this pattern works and how to apply it to the task" }
    ],
    "risks": [
      { "area": "e.g. Authentication flow", "description": "Specific risk based on what you see in the code", "severity": "low|medium|high", "mitigation": "Concrete action to avoid this risk" }
    ],
    "integrationConcerns": [
      { "system": "e.g. Firebase Auth", "concern": "e.g. Need to configure FCM credentials before this will work", "recommendation": "e.g. Add firebase-admin SDK, create service account JSON, add to .env" }
      Think about: What external services need setup? What credentials are needed? What existing systems might conflict?
    ],
    "implementationHints": {
      "existingPatterns": ["e.g. Follow the GitHubTokenService pattern for token encryption"],
      "conventionsToFollow": ["e.g. All guards extend CanActivate and are registered in module providers"],
      "testingApproach": "Based on existing test patterns: e.g. unit test the guard with mock FirebaseAuth",
      "estimatedComplexity": "low|medium|high",
      "recommendedRounds": "0-3 integer. 0=trivial task (e.g. rename, change text), no questions needed, go straight to spec. 1=clear task with minor ambiguity (e.g. add a simple button). 2=moderate task with design decisions (e.g. add a form with validation). 3=complex task with significant ambiguity (e.g. implement OAuth2 from scratch). Base this on how much clarification the developer would realistically need."
    },
    "apiChanges": {
      "endpoints": [
        For each API endpoint that needs to be created, modified, or deprecated for "${title}":
        {
          "method": "GET|POST|PUT|PATCH|DELETE",
          "route": "/api/exact/path/:param",
          "controller": "path/to/controller.ts",
          "dto": {
            "request": "RequestDtoType or { field: type }",
            "response": "ResponseDtoType or { field: type }"
          },
          "description": "What this endpoint does",
          "authentication": "required|optional|none",
          "status": "new|modified|deprecated"
        }
      ],
      "baseUrl": "API base URL if detectable",
      "middlewares": ["auth", "validation", "rate-limiting"],
      "rateLimiting": "Rate limiting strategy if applicable"
    },
    "llmFilesRead": ${JSON.stringify(llmFilesRead)},
    "analysisTimestamp": "${new Date().toISOString()}"
  }
}

ADDITIONAL RULES for apiChanges:
- Detect ALL API routes from NestJS controllers (@Get, @Post, @Put, @Patch, @Delete decorators), Express routes, or Next.js API routes
- Include the FULL route path (e.g., "/api/v1/tickets/:id" not just "/tickets/:id")
- For existing endpoints being modified, set status="modified" and describe what changes
- For new endpoints, set status="new"
- Include DTO shapes: request body type and response type
- Set authentication based on guards/middleware present (e.g., @UseGuards(AuthGuard) = "required")
- If no API endpoints are affected, return empty endpoints array: "endpoints": []

QUALITY RULES:
1. "files" array = ONLY files relevant to "${title}". NOT random project files.
2. "suggestedChanges" must be SPECIFIC: "Add authenticateUser() method that calls Firebase Admin SDK verifyIdToken()" not "add authentication logic"
3. "integrationConcerns" must mention SETUP STEPS: credentials, environment variables, external service configuration
4. "risks" must be based on ACTUAL code issues you observed, not hypothetical
5. If the codebase already has similar functionality (e.g. existing auth), mention it and explain how to integrate
6. Return ONLY the JSON object, nothing else`;

    const response = await this.callLLM(systemPrompt, userPrompt);
    const parsed = this.parseJSON<DeepAnalysisResult>(response);

    // Validate required top-level fields
    if (!parsed.stack || !parsed.analysis || !Array.isArray(parsed.files)) {
      throw new Error('Invalid deep analysis structure: missing required fields');
    }

    // Ensure arrays exist
    if (!parsed.stack.buildTools) parsed.stack.buildTools = [];
    if (!parsed.stack.dependencies) parsed.stack.dependencies = [];
    if (!parsed.stack.devDependencies) parsed.stack.devDependencies = [];
    if (!parsed.analysis.directories) parsed.analysis.directories = [];

    // Ensure taskAnalysis has correct timestamp and files read
    if (parsed.taskAnalysis) {
      parsed.taskAnalysis.llmFilesRead = llmFilesRead;
      parsed.taskAnalysis.analysisTimestamp = new Date().toISOString();

      // Clamp recommendedRounds to valid range 0-3
      if (parsed.taskAnalysis.implementationHints) {
        const raw = parsed.taskAnalysis.implementationHints.recommendedRounds;
        const num = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
        parsed.taskAnalysis.implementationHints.recommendedRounds = isNaN(num)
          ? 3
          : Math.max(0, Math.min(3, Math.round(num)));
      }

      // Attach fingerprint for downstream use (tech stack fallback)
      if (fingerprint) {
        (parsed.taskAnalysis as any).fingerprint = {
          primaryLanguage: fingerprint.primaryLanguage,
          languages: fingerprint.languages,
          frameworks: fingerprint.frameworks,
          packageManager: fingerprint.packageManager,
        };
      }
    }

    return parsed;
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Build condensed file tree string — ONLY source code files.
   * Aggressively filters out non-source directories and files.
   */
  private buildFileTreeString(tree: FileTree): string {
    const paths = tree.tree
      .filter((entry) => {
        // Skip directories entirely from the listing (only show files)
        if (entry.type === 'tree') return false;

        const parts = entry.path.split('/');

        // Skip if any DIRECTORY segment is in SKIP_DIRS
        // Only check directory parts (not the filename itself)
        const dirParts = parts.slice(0, -1);
        if (dirParts.some((part) => SKIP_DIRS.has(part))) return false;

        // Skip hidden DIRECTORIES only (dot-prefixed directory names)
        // Allow hidden files like .env.example, .eslintrc, .prettierrc at any level
        if (dirParts.some((part) => part.startsWith('.'))) return false;

        // Skip binary/generated file extensions
        const fileName = parts[parts.length - 1];
        const ext = fileName.includes('.') ? '.' + fileName.split('.').pop()!.toLowerCase() : '';
        if (SKIP_EXTENSIONS.has(ext)) return false;

        // Skip very large files (likely generated)
        if (entry.size && entry.size > MAX_FILE_SIZE_BYTES) return false;

        return true;
      })
      .map((entry) => entry.path);

    // Limit to ~400 entries to keep token count reasonable
    const limited = paths.slice(0, 400);
    if (paths.length > 400) {
      limited.push(`... and ${paths.length - 400} more source files`);
    }

    return limited.join('\n');
  }

  /**
   * Build config file contents string for prompts
   */
  private buildConfigContents(configFiles: Map<string, string>): string {
    const sections: string[] = [];
    for (const [path, content] of configFiles) {
      const truncated =
        content.length > 3000 ? content.slice(0, 3000) + '\n... (truncated)' : content;
      sections.push(`--- ${path} ---\n${truncated}`);
    }
    return sections.join('\n\n');
  }

  /**
   * Call LLM with system and user prompts via Vercel AI SDK
   */
  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.llmModel) {
      throw new Error('No LLM model configured. Set LLM_PROVIDER and credentials.');
    }

    try {
      this.logger.log(
        `Calling LLM (${this.providerName}), prompt length: ${userPrompt.length} chars`,
      );
      const startTime = Date.now();

      const { text } = await generateText({
        model: this.llmModel,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 4096,
        temperature: 0.1,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`LLM responded in ${elapsed}s (${text.length} chars)`);
      return text;
    } catch (error: any) {
      this.logger.error(`LLM call failed (${this.providerName}): ${error.message}`);
      throw new Error(`LLM call failed: ${error.message}`);
    }
  }

  /**
   * Parse JSON from LLM response (may be wrapped in markdown fences)
   */
  private parseJSON<T>(response: string): T {
    try {
      if (typeof response === 'object' && response !== null) {
        return response as T;
      }

      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      throw new Error(`Failed to parse LLM response as JSON: ${String(error)}`);
    }
  }

  /**
   * Build a degraded result when LLM fails entirely
   */
  private buildDegradedResult(fileTree: FileTree): DeepAnalysisResult {
    const importantFiles = fileTree.tree
      .filter((f) => {
        if (f.type !== 'blob') return false;
        const parts = f.path.split('/');
        if (parts.some((p) => SKIP_DIRS.has(p))) return false;
        if (parts.some((p) => p.startsWith('.'))) return false;
        return f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.path.endsWith('.js');
      })
      .slice(0, 20)
      .map((f) => ({
        path: f.path,
        name: f.path.split('/').pop() || f.path,
        isDirectory: false,
      }));

    return {
      stack: {
        framework: null,
        language: { name: 'Unknown' },
        packageManager: { type: 'npm' },
        buildTools: [],
        dependencies: [],
        devDependencies: [],
      },
      analysis: {
        architecture: { type: 'Unknown' },
        naming: { files: 'Unknown' },
        testing: { runner: null, location: 'Unknown' },
        stateManagement: null,
        apiRouting: null,
        directories: [],
      },
      files: importantFiles,
      taskAnalysis: null,
    };
  }
}
