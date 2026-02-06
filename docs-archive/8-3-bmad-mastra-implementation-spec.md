# Story 8.3 - BMAD Tech-Spec → Mastra Implementation Specification

## Executive Summary

This document specifies how to implement the BMAD tech-spec workflow **perfectly** in Mastra, replacing the current 12-step generic workflow with a code-aware, context-rich generation system.

---

## BMAD Tech-Spec Workflow Analysis

### Core Philosophy (MUST PRESERVE)

```
CONTEXT IS KING - Gather ALL available context before generating specs
NO AMBIGUITY - Everything must be DEFINITIVE (specific versions, exact file paths)
LIVING DOCUMENT - Write continuously as you discover
ZERO "OR" STATEMENTS - Every technical decision is final
```

### BMAD Steps Mapped to Mastra

| BMAD Step | Description | Mastra Implementation |
|-----------|-------------|----------------------|
| 0 | Validate readiness, detect project type | `initializeStep` - Lock AEC, detect greenfield/brownfield |
| 0.5 | Discover and load input documents | `discoverContextStep` - Load via GitHub API |
| 1 | Comprehensive context discovery | `analyzeCodebaseStep` - Read files, detect stack, analyze patterns |
| 2 | Conversational discovery | `gatherRequirementsStep` - SUSPENSION for user input |
| 3 | Generate definitive tech spec | `generateTechSpecStep` - LLM with full context |
| 4 | Auto-validate quality | `validateTechSpecStep` - Check completeness |
| 5 | Generate stories | `generateStoriesStep` - Break into AC/tasks |
| 6 | Finalize | `finalizeStep` - Map to AEC, unlock |

---

## GitHub API File Access Strategy

### The Challenge
BMAD assumes local filesystem. We have GitHub API.

### The Solution: Smart Selective Fetching

```typescript
interface GitHubFileReader {
  // Step 1: Get repo structure (single API call)
  getTree(owner: string, repo: string, branch?: string): Promise<TreeEntry[]>;

  // Step 2: Read specific files (N API calls)
  readFile(owner: string, repo: string, path: string): Promise<string>;

  // Step 3: Search for patterns (using tree + content)
  findByPattern(tree: TreeEntry[], pattern: string): string[];

  // Step 4: Grep-like search (fetch + search)
  searchContent(owner: string, repo: string, paths: string[], query: string): Promise<SearchResult[]>;
}
```

### File Selection Strategy

```typescript
// Phase 1: Get structure
const tree = await github.getTree(owner, repo);  // ~1 API call

// Phase 2: Identify critical files (no API calls - just filtering)
const criticalFiles = identifyCriticalFiles(tree, {
  // Package manifests
  manifests: ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml'],
  // Config files
  configs: ['.eslintrc*', '.prettierrc*', 'tsconfig.json', 'jest.config.*'],
  // Entry points
  entryPoints: ['src/index.*', 'src/main.*', 'app/**/page.*'],
  // Based on user's request keywords
  relevantByKeywords: findRelevantPaths(tree, keywords),
});

// Phase 3: Fetch selected files (N API calls, typically 20-50)
const fileContents = await Promise.all(
  criticalFiles.map(path => github.readFile(owner, repo, path))
);
```

---

## New Workflow Architecture

### Step 0: Initialize and Lock

```typescript
const initializeStep = createStep({
  id: 'initialize',
  description: 'Lock AEC and validate GitHub access',
  execute: async ({ inputData, mastra, setState }) => {
    const { aecId, workspaceId } = inputData;
    const aecRepository = mastra.getService('AECRepository');
    const githubService = mastra.getService('GitHubService');

    // Lock AEC
    const aec = await aecRepository.findById(aecId);
    aec.startGenerating(workflowRunId);

    // Validate GitHub access
    const repoContext = aec.repositoryContext;
    if (!repoContext) {
      throw new Error('Repository context required for tech-spec generation');
    }

    // Determine greenfield vs brownfield
    const tree = await githubService.getTree(
      repoContext.repositoryFullName,
      repoContext.branchName
    );

    const isGreenfield = tree.length < 20; // Very few files = greenfield
    const projectType = isGreenfield ? 'greenfield' : 'brownfield';

    await setState({ aecId, workspaceId, projectType, tree });

    return { locked: true, projectType, fileCount: tree.length };
  },
});
```

### Step 1: Discover Context (CRITICAL)

```typescript
const discoverContextStep = createStep({
  id: 'discoverContext',
  description: 'Comprehensive context gathering - THE MOST IMPORTANT STEP',
  execute: async ({ state, mastra, setState }) => {
    const { tree, aecId } = state;
    const githubService = mastra.getService('GitHubService');
    const aecRepository = mastra.getService('AECRepository');
    const aec = await aecRepository.findById(aecId);

    // Update progress
    await updateProgress(aecRepository, aecId, 1, 'in-progress', 'Discovering project context...');

    // ========================================
    // PHASE 1: DETECT PROJECT STACK
    // ========================================
    const stackInfo = await detectProjectStack(githubService, aec.repositoryContext, tree);
    // Returns: { framework, version, dependencies, devTools, scripts, projectType }

    // ========================================
    // PHASE 2: BROWNFIELD CODEBASE RECONNAISSANCE
    // ========================================
    let codebaseAnalysis = null;
    if (state.projectType === 'brownfield') {
      codebaseAnalysis = await analyzeBrownfieldCodebase(githubService, aec.repositoryContext, tree);
      // Returns: {
      //   directoryStructure,
      //   codePatterns,
      //   namingConventions,
      //   keyModules,
      //   testingPatterns: { framework, fileNaming, organization, mockingLibrary },
      //   codeStyle: { semicolons, quotes, indentation, lineLength },
      //   importPatterns,
      //   errorHandling,
      //   loggingPatterns,
      // }
    }

    // ========================================
    // PHASE 3: READ KEY FILES FOR CONTEXT
    // ========================================
    const keyFiles = await readKeyFiles(githubService, aec.repositoryContext, tree, {
      maxFiles: 30,
      prioritize: [
        'package.json',
        'tsconfig.json',
        ...findSimilarFeatureFiles(tree, aec.title),  // Files likely related to the request
      ],
    });

    await setState({
      stackInfo,
      codebaseAnalysis,
      keyFiles,
    });

    await updateProgress(aecRepository, aecId, 1, 'complete',
      `Analyzed ${keyFiles.length} files, detected ${stackInfo.framework} ${stackInfo.version}`);

    return { stackInfo, codebaseAnalysis, keyFilesCount: keyFiles.length };
  },
});
```

### Step 2: Gather Requirements (SUSPENSION POINT)

```typescript
const gatherRequirementsStep = createStep({
  id: 'gatherRequirements',
  description: 'Understand what needs to be built (optional suspension)',
  suspendSchema: z.object({
    reason: z.literal('clarification_needed'),
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      context: z.string(),  // Why we're asking
      options: z.array(z.string()).optional(),
    })),
    currentUnderstanding: z.object({
      problem: z.string(),
      proposedSolution: z.string(),
      scopeIn: z.array(z.string()),
      scopeOut: z.array(z.string()),
    }),
  }),
  resumeSchema: z.object({
    action: z.enum(['proceed', 'clarify']),
    answers: z.record(z.string()).optional(),
    additionalContext: z.string().optional(),
  }),
  execute: async ({ state, mastra, setState, suspend, resumeData }) => {
    const { aecId, stackInfo, codebaseAnalysis, keyFiles } = state;
    const aecRepository = mastra.getService('AECRepository');
    const contentGenerator = mastra.getService('TechSpecGenerator');
    const aec = await aecRepository.findById(aecId);

    // If resuming with clarifications, incorporate them
    if (resumeData?.answers) {
      await setState({ userClarifications: resumeData.answers });
    }

    // Generate initial understanding using LLM
    const understanding = await contentGenerator.analyzeRequest({
      title: aec.title,
      description: aec.description,
      stackInfo,
      codebaseAnalysis,
      keyFiles,
      userClarifications: state.userClarifications,
    });

    // If there are critical unknowns, suspend for clarification
    if (understanding.needsClarification && !resumeData) {
      await updateProgress(aecRepository, aecId, 2, 'suspended', 'Awaiting clarification');

      return await suspend({
        reason: 'clarification_needed',
        questions: understanding.questions,
        currentUnderstanding: {
          problem: understanding.problem,
          proposedSolution: understanding.solution,
          scopeIn: understanding.scopeIn,
          scopeOut: understanding.scopeOut,
        },
      });
    }

    // Store final understanding
    await setState({
      problem: understanding.problem,
      solution: understanding.solution,
      scopeIn: understanding.scopeIn,
      scopeOut: understanding.scopeOut,
      changeType: understanding.changeType,
    });

    return understanding;
  },
});
```

### Step 3: Generate Tech Spec (THE CORE)

```typescript
const generateTechSpecStep = createStep({
  id: 'generateTechSpec',
  description: 'Generate context-aware, definitive technical specification',
  execute: async ({ state, mastra, setState }) => {
    const {
      aecId, stackInfo, codebaseAnalysis, keyFiles,
      problem, solution, scopeIn, scopeOut, changeType,
    } = state;

    const aecRepository = mastra.getService('AECRepository');
    const techSpecGenerator = mastra.getService('TechSpecGenerator');

    await updateProgress(aecRepository, aecId, 3, 'in-progress', 'Generating technical specification...');

    // ========================================
    // GENERATE DEFINITIVE TECH SPEC
    // ========================================
    const techSpec = await techSpecGenerator.generate({
      // Context (from Step 1)
      stackInfo,
      codebaseAnalysis,
      keyFiles,

      // Requirements (from Step 2)
      problem,
      solution,
      scopeIn,
      scopeOut,
      changeType,

      // CRITICAL INSTRUCTIONS
      instructions: TECH_SPEC_INSTRUCTIONS,  // Ported from BMAD
    });

    // Validate definitiveness - NO "or" statements
    const ambiguities = findAmbiguities(techSpec);
    if (ambiguities.length > 0) {
      // Re-generate with stricter instructions
      techSpec = await techSpecGenerator.makeDefinitive(techSpec, ambiguities);
    }

    await setState({ techSpec });

    return techSpec;
  },
});

// BMAD Tech Spec Instructions (Ported)
const TECH_SPEC_INSTRUCTIONS = `
You are generating a DEFINITIVE technical specification. Follow these rules EXACTLY:

## CRITICAL RULES

1. **NO AMBIGUITY ALLOWED**
   - NEVER use "or" statements: "use X or Y" ❌
   - NEVER use vague terms: "some kind of", "something like" ❌
   - ALWAYS specify exact versions: "React 18.2.0" ✅
   - ALWAYS specify exact file paths: "src/services/UserService.ts" ✅

2. **USE DETECTED STACK**
   - Reference exact versions from package.json/requirements.txt
   - Follow existing patterns identified in codebase analysis
   - Respect existing naming conventions and code style

3. **SOURCE TREE CHANGES MUST BE SPECIFIC**
   Bad: "Update some files in the services folder" ❌
   Good: "src/services/UserService.ts - MODIFY - Add validateEmail() method at line 45" ✅

4. **TECHNICAL APPROACH MUST BE DEFINITIVE**
   Bad: "Use a logging library like winston or pino" ❌
   Good: "Use winston v3.8.2 (already in package.json) for logging" ✅

## OUTPUT STRUCTURE

Generate a tech spec with these sections:
1. Context (loaded docs, project stack, existing structure)
2. The Change (problem, solution, scope)
3. Implementation Details (source tree changes, technical approach, patterns to follow)
4. Development Context (relevant code, dependencies, config changes)
5. Implementation Guide (setup steps, implementation steps, testing, acceptance criteria)
6. Developer Resources (file paths, key code locations)
`;
```

### Step 4: Validate Tech Spec

```typescript
const validateTechSpecStep = createStep({
  id: 'validateTechSpec',
  description: 'Auto-validate cohesion, completeness, and quality',
  execute: async ({ state, mastra, setState }) => {
    const { techSpec, aecId } = state;
    const aecRepository = mastra.getService('AECRepository');

    await updateProgress(aecRepository, aecId, 4, 'in-progress', 'Validating tech spec...');

    const validation = {
      contextGathering: 'comprehensive',  // or 'partial' or 'insufficient'
      definitiveness: 'all_definitive',   // or 'some_ambiguity' or 'significant_ambiguity'
      brownfieldIntegration: 'excellent', // or 'partial' or 'missing' or 'n/a'
      stackAlignment: 'perfect',          // or 'good' or 'partial' or 'none'
      implementationReadiness: true,
    };

    // Check for "or" statements
    const orStatements = findOrStatements(techSpec);
    if (orStatements.length > 0) {
      validation.definitiveness = 'some_ambiguity';
      validation.issues = orStatements;
    }

    // Check for missing versions
    const missingVersions = findMissingVersions(techSpec);
    if (missingVersions.length > 0) {
      validation.stackAlignment = 'partial';
      validation.issues = [...(validation.issues || []), ...missingVersions];
    }

    // Check for vague file paths
    const vagueePaths = findVaguePaths(techSpec);
    if (vagueePaths.length > 0) {
      validation.implementationReadiness = false;
      validation.issues = [...(validation.issues || []), ...vagueePaths];
    }

    await setState({ validation });

    return validation;
  },
});
```

### Step 5: Generate Stories

```typescript
const generateStoriesStep = createStep({
  id: 'generateStories',
  description: 'Break tech spec into acceptance criteria and tasks',
  execute: async ({ state, mastra, setState }) => {
    const { techSpec, aecId, changeType } = state;
    const aecRepository = mastra.getService('AECRepository');
    const storyGenerator = mastra.getService('StoryGenerator');

    await updateProgress(aecRepository, aecId, 5, 'in-progress', 'Generating acceptance criteria...');

    // Determine story count based on complexity
    const storyCount = determineStoryCount(techSpec);

    const stories = await storyGenerator.generate({
      techSpec,
      storyCount,
      format: {
        acceptanceCriteria: 'Given/When/Then',
        tasks: 'Checkbox with AC references',
      },
    });

    // Map to AEC format
    const acceptanceCriteria = stories.flatMap(s => s.acceptanceCriteria);
    const assumptions = techSpec.assumptions;
    const repoPaths = techSpec.sourceTreeChanges.map(c => c.path);
    const questions = stories.flatMap(s => s.openQuestions).slice(0, 3);

    await setState({
      acceptanceCriteria,
      assumptions,
      repoPaths,
      questions,
      estimate: techSpec.complexity,
    });

    return { storyCount, acceptanceCriteria, assumptions, repoPaths };
  },
});
```

### Step 6: Finalize and Map to AEC

```typescript
const finalizeStep = createStep({
  id: 'finalize',
  description: 'Map tech spec to AEC and unlock',
  execute: async ({ state, mastra }) => {
    const {
      aecId, changeType, techSpec,
      acceptanceCriteria, assumptions, repoPaths, questions, estimate,
      validation,
    } = state;

    const aecRepository = mastra.getService('AECRepository');
    const aec = await aecRepository.findById(aecId);

    await updateProgress(aecRepository, aecId, 6, 'in-progress', 'Saving to ticket...');

    // Map tech spec output to AEC fields
    aec.updateContent(
      mapChangeType(changeType),  // FEATURE, BUG, REFACTOR, CHORE
      acceptanceCriteria,
      assumptions,
      repoPaths,
    );

    // Add questions (max 3)
    if (questions.length > 0) {
      aec.addQuestions(questions.slice(0, 3).map(q => ({
        id: q.id,
        text: q.question,
        type: q.options ? 'multi-choice' : 'binary',
        options: q.options?.map(o => ({ label: o, value: o.toLowerCase().replace(/\s+/g, '_') })),
        defaultAssumption: q.defaultAssumption,
      })));
    }

    // Add estimate
    if (estimate) {
      aec.setEstimate({
        min: estimate.minHours,
        max: estimate.maxHours,
        confidence: estimate.confidence,
        drivers: estimate.drivers,
      });
    }

    // Add findings from validation
    if (validation.issues?.length > 0) {
      aec.setPreImplementationFindings(validation.issues.map(issue => ({
        id: randomUUID(),
        category: 'spec_quality',
        severity: 'medium',
        description: issue.message,
        suggestion: issue.fix,
        confidence: 0.9,
      })));
    }

    // Transition to VALIDATED and unlock
    aec.validate([]);

    await aecRepository.update(aec);

    await updateProgress(aecRepository, aecId, 6, 'complete', 'Ticket ready');

    return { success: true };
  },
});
```

---

## TechSpecGenerator Service

The core LLM service that generates the tech spec.

```typescript
@Injectable()
export class TechSpecGenerator {
  constructor(
    private readonly mastra: MastraService,
    private readonly githubService: GitHubService,
  ) {}

  async generate(input: TechSpecInput): Promise<TechSpec> {
    const agent = this.mastra.getAgent('techSpecAgent');

    // Build comprehensive prompt
    const prompt = this.buildPrompt(input);

    // Generate with structured output
    const result = await agent.generate(prompt, {
      output: techSpecSchema,  // Zod schema for structured output
    });

    return result;
  }

  private buildPrompt(input: TechSpecInput): string {
    return `
# Technical Specification Generation

## Project Context

### Detected Stack
${JSON.stringify(input.stackInfo, null, 2)}

### Codebase Analysis (Brownfield)
${input.codebaseAnalysis ? JSON.stringify(input.codebaseAnalysis, null, 2) : 'N/A - Greenfield project'}

### Key Files Content
${input.keyFiles.map(f => `
### ${f.path}
\`\`\`${f.language}
${f.content}
\`\`\`
`).join('\n')}

## The Change

### Problem Statement
${input.problem}

### Proposed Solution
${input.solution}

### Scope
**In Scope:**
${input.scopeIn.map(s => `- ${s}`).join('\n')}

**Out of Scope:**
${input.scopeOut.map(s => `- ${s}`).join('\n')}

## Instructions

${TECH_SPEC_INSTRUCTIONS}

Generate a complete, DEFINITIVE technical specification following the structure above.
`;
  }
}
```

---

## Workflow Definition

```typescript
export const techSpecWorkflow = createWorkflow({
  id: 'tech-spec-generation',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
  }),
  stateSchema: techSpecStateSchema,
})
  .then(initializeStep)
  .then(discoverContextStep)
  .then(gatherRequirementsStep)
  .then(generateTechSpecStep)
  .then(validateTechSpecStep)
  .then(generateStoriesStep)
  .then(finalizeStep)
  .commit();
```

---

## Services to Create

| Service | Purpose |
|---------|---------|
| `GitHubFileService` | Read files from GitHub API |
| `ProjectStackDetector` | Detect framework, versions, dependencies |
| `CodebaseAnalyzer` | Analyze brownfield patterns, conventions |
| `TechSpecGenerator` | LLM service for generating tech spec |
| `StoryGenerator` | Break tech spec into stories/AC |
| `TechSpecValidator` | Validate definitiveness and completeness |

---

## Code to Remove (After Integration)

| File/Service | Reason |
|--------------|--------|
| `MastraContentGenerator.extractIntent()` | Replaced by TechSpecGenerator analysis |
| `MastraContentGenerator.detectType()` | Replaced by changeType in tech spec |
| `MastraContentGenerator.generateDraft()` | Replaced by TechSpecGenerator |
| `FindingsToQuestionsAgent` | Questions come from tech spec |
| `IndexQueryService` | Replaced by GitHub direct file access |
| All indexing code | No longer needed |

---

## Field Mapping: TechSpec → AEC

| TechSpec Output | AEC Field | Notes |
|-----------------|-----------|-------|
| `changeType` | `type` | FEATURE, BUG, REFACTOR, CHORE |
| `acceptanceCriteria[]` | `acceptanceCriteria` | Given/When/Then format |
| `assumptions[]` | `assumptions` | Direct |
| `sourceTreeChanges[].path` | `repoPaths` | Exact file paths |
| `openQuestions[]` | `questions` | Max 3, with options |
| `complexity` | `estimate` | { min, max, confidence, drivers } |
| `validation.issues[]` | `preImplementationFindings` | Quality issues |

---

## Success Criteria

After implementation, generated tickets should:

1. ✅ Reference **actual files** from the codebase (not generic paths)
2. ✅ Follow **existing patterns** identified in the code
3. ✅ Use **exact versions** from package.json/requirements.txt
4. ✅ Provide **specific file paths** with CREATE/MODIFY/DELETE actions
5. ✅ Include **code-aware questions** based on analysis
6. ✅ Generate **testable acceptance criteria** in Given/When/Then format
7. ✅ Have **zero ambiguity** - no "or" statements

---

## Implementation Order

1. **Create GitHubFileService** - File reading via API
2. **Create ProjectStackDetector** - Stack detection
3. **Create CodebaseAnalyzer** - Brownfield analysis
4. **Create TechSpecGenerator** - Core generation
5. **Create new workflow** - 7 steps
6. **Add feature flag** - `USE_TECH_SPEC_WORKFLOW`
7. **Test end-to-end** - Verify output quality
8. **Remove old code** - Cleanup

---

## Estimated Complexity

| Component | Effort |
|-----------|--------|
| GitHubFileService | Medium |
| ProjectStackDetector | Low |
| CodebaseAnalyzer | Medium-High |
| TechSpecGenerator | High |
| StoryGenerator | Medium |
| Workflow integration | Medium |
| Testing | Medium |
| Cleanup | Low |

**Total: Significant effort, but critical for product value.**
