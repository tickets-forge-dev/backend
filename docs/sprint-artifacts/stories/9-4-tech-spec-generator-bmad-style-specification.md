# Story 9-4: Tech-Spec Generator (BMAD-Style Specification)

## User Story

**As a** backend developer
**I want** a service that generates BMAD-style tech specs with full codebase context
**So that** tickets are definitive, specific, and code-aware with zero ambiguity

---

## Acceptance Criteria

- **AC-1:** Service accepts input: title, description (optional), github context (owner, repo, branch), stack info, codebase analysis
- **AC-2:** Generates Problem Statement section (what problem are we solving, why does it matter, context)
- **AC-3:** Generates Solution section (specific implementation steps, file paths, line numbers, code references)
- **AC-4:** Generates In-Scope and Out-of-Scope sections (explicit boundaries)
- **AC-5:** Generates Acceptance Criteria in BDD-style Given/When/Then format (5+ criteria)
- **AC-6:** Generates clarification questions as structured form fields (radio buttons, checkboxes, text inputs)
- **AC-7:** Lists specific files to create/modify with exact paths, line numbers, and suggested changes
- **AC-8:** Output has ZERO ambiguity (no "or" statements, no "might", all decisions definitive)
- **AC-9:** Output includes quality score (0-100) indicating completeness and specificity
- **AC-10:** Comprehensive unit tests with mocked LLM (100% coverage)
- **AC-11:** JSDoc documentation with prompt engineering notes

---

## Tasks

### Implementation

- [ ] Create `TechSpecGenerator` interface in domain layer
  - `generate(input: TechSpecInput): Promise<TechSpec>`
  - `generateProblemStatement(title: string, description: string, context: CodebaseContext): Promise<string>`
  - `generateSolution(problem: string, context: CodebaseContext): Promise<SolutionSection>`
  - `generateAcceptanceCriteria(context: CodebaseContext): Promise<AcceptanceCriterion[]>`
  - `generateClarificationQuestions(context: CodebaseContext): Promise<ClarificationQuestion[]>`
  - `generateFileChanges(solution: string, context: CodebaseContext): Promise<FileChange[]>`
  - `calculateQualityScore(spec: TechSpec): number`

- [ ] Implement `TechSpecGeneratorImpl` in application/use-cases layer

  **Problem Statement Generation:**
  - Use LLM with context injection (not vector search)
  - Prompt includes: title, description, framework/language, existing patterns
  - Generate narrative explaining the problem and its importance
  - Extract key assumptions and constraints
  - Include relevant code context from codebase

  **Solution Generation:**
  - Use LLM to generate step-by-step implementation plan
  - Include specific file paths based on detected directory structure
  - Reference existing code patterns and conventions
  - Generate pseudo-code or actual code snippets where applicable
  - Include line numbers for modifications to existing files
  - Consider project's architecture pattern in recommendations
  - Suggest specific functions/components to create or modify

  **Acceptance Criteria Generation (BDD Format):**
  - Use LLM to generate Given/When/Then format
  - Generate minimum 5 acceptance criteria
  - Each criterion should be testable and unambiguous
  - Reference specific files, functions, or components
  - Include edge cases and error scenarios
  - Ensure criteria align with problem statement

  **Clarification Questions Generation:**
  - Use LLM to identify ambiguities in original request
  - Generate questions that resolve ambiguities
  - Structure questions with specific types (radio, checkbox, text, select)
  - Include context and examples in question text
  - Provide reasonable default answers
  - Questions should be answerable from codebase context

  **File Changes Generation:**
  - Analyze solution to identify files needing changes
  - For each file: path, action (create/modify), line numbers, suggested changes
  - Include imports/exports that need updating
  - Reference existing code patterns to follow
  - Suggest test file additions

- [ ] Create prompt engineering system
  - Central prompt template with context injection placeholders
  - System prompt: "You are a technical specification writer. Generate specs with ZERO ambiguity. No 'or' statements. All decisions definitive."
  - Context placeholders: {FRAMEWORK}, {LANGUAGE}, {STACK}, {PATTERNS}, {CODE_EXAMPLES}
  - Separate prompts for each section (problem, solution, AC, questions)
  - Instructions to maintain consistency with project conventions
  - Instructions for code-specific language and references

- [ ] Implement LLM integration
  - Use Anthropic Claude API (or configured LLM provider)
  - Inject full context: stack, patterns, file samples from codebase
  - Stream or batch response based on size
  - Parse LLM response into structured output
  - Validate response structure and completeness
  - Implement fallback/retry logic for API failures

- [ ] Implement ambiguity detection and removal
  - Scan all text for ambiguous language ("or", "might", "possibly", "optional", "maybe")
  - Flag sections with ambiguity
  - Use LLM to rewrite ambiguous sections with definitive language
  - Validate output has zero ambiguity markers
  - Generate warnings for any remaining edge cases

- [ ] Create quality scoring algorithm
  - Problem Statement completeness (0-20 points): clear problem, why it matters, context provided
  - Solution specificity (0-30 points): file paths included, line numbers provided, code examples present
  - Acceptance Criteria quality (0-20 points): BDD format, testability, edge cases covered
  - File Changes clarity (0-15 points): specific paths, line numbers, suggested changes
  - Ambiguity score (0-15 points): deduct for ambiguous language, reward for definitive statements
  - Final score: sum of all categories (0-100)

- [ ] Implement output validation
  - Validate all sections are present
  - Verify ACs match problem statement
  - Verify file changes align with solution
  - Check for circular dependencies or logical inconsistencies
  - Ensure no security implications overlooked
  - Verify alignment with project conventions

- [ ] Write unit tests in `__tests__/tech-spec-generator.spec.ts`
  - Mock LLM responses for deterministic testing
  - Test problem statement generation with various inputs
  - Test solution generation with code context
  - Test AC generation in BDD format
  - Test clarification question generation
  - Test file change identification
  - Test ambiguity detection (catch "or" statements, etc.)
  - Test quality score calculation
  - Test with different project types (Next.js, React, Python, Go)
  - Test error handling (LLM timeout, API failure, malformed response)
  - Test edge cases (minimal input, very complex request)

- [ ] Add JSDoc documentation
  - Document prompt engineering approach
  - Include example LLM prompts
  - Document context injection methodology
  - Explain quality scoring algorithm
  - Document ambiguity detection rules

---

## Development Notes

### Architecture Layer
**Application** - Use case for spec generation

### Design Patterns
- Strategy pattern for different spec sections (problem, solution, AC, questions)
- Template Method pattern for spec generation pipeline
- Decorator pattern for ambiguity detection and quality scoring
- Adapter pattern for LLM provider abstraction

### Dependencies
- Story 9-1: GitHub File Service (to read relevant code)
- Story 9-2: Project Stack Detector (for stack context)
- Story 9-3: Codebase Analyzer (for pattern context)
- LLM API client (Anthropic Claude, OpenAI, or configurable)

### Prompt Engineering Strategy
Key principles:
1. **Context Injection:** Inject full stack, patterns, code examples into every prompt
2. **Role Setting:** "You are a technical specification writer..."
3. **Instruction Clarity:** Explicit rules ("ZERO ambiguity", "No 'or' statements")
4. **Format Specification:** "Generate in BDD Given/When/Then format"
5. **Reference Materials:** Include relevant code patterns and examples
6. **Constraint Specification:** "Reference existing code patterns", "Follow project conventions"

Example System Prompt:
```
You are a technical specification writer specializing in code-aware specifications.
Your task is to generate ZERO-AMBIGUITY technical specifications.

RULES:
1. No "or" statements - all decisions are definitive
2. No "might", "could", "possibly" - use "will", "must", "shall"
3. All file paths must be complete and specific
4. All code references must include exact line numbers
5. All acceptance criteria must be testable
6. Always reference existing code patterns and conventions

PROJECT CONTEXT:
- Framework: {FRAMEWORK}
- Language: {LANGUAGE}
- Architecture: {ARCHITECTURE}
- Testing: {TESTING_STRATEGY}

Follow these conventions in your output:
{CONVENTIONS}

Reference these code patterns:
{CODE_SAMPLES}
```

### Edge Cases to Handle
1. Requests with insufficient context (minimal description)
2. Requests that conflict with existing patterns
3. Requests for deprecated technologies
4. Requests that span multiple architecture layers
5. Requests with security implications
6. Requests that would require breaking changes
7. Very large specifications (10000+ words)
8. LLM timeouts or API failures
9. Malformed or unparseable LLM responses
10. Requests asking to modify framework/language (out of scope)

### Performance Considerations
- Cache generated specs (same request hash = same output)
- Limit context injection to avoid token limits (prioritize: stack, patterns, relevant samples)
- Implement streaming for large responses
- Parallelize independent generation tasks where possible
- Set reasonable timeouts for LLM calls (30 seconds)

---

## Dependencies

**Must complete before:**
- Story 9-5: Frontend 4-Stage Wizard (consumes generated specs)

**Depends on:**
- Story 9-1: GitHub File Service
- Story 9-2: Project Stack Detector
- Story 9-3: Codebase Analyzer

---

## Implementation Reference

### Example Domain Types

```typescript
export interface TechSpecInput {
  title: string;
  description?: string;
  owner: string;
  repo: string;
  branch?: string;
  githubContext: {
    tree: FileTree;
    files: Map<string, string>;
  };
  stack: ProjectStack;
  analysis: CodebaseAnalysis;
}

export interface ProblemStatement {
  narrative: string; // Clear explanation of the problem
  whyItMatters: string; // Impact and importance
  context: string; // Relevant background
  assumptions: string[]; // Key assumptions
  constraints: string[]; // Known constraints
}

export interface SolutionStep {
  order: number;
  description: string;
  file?: string; // Path if specific file involved
  lineNumbers?: [number, number]; // Start, end line numbers
  codeSnippet?: string; // Optional code reference
}

export interface SolutionSection {
  overview: string; // High-level solution description
  steps: SolutionStep[];
  fileChanges: {
    create: string[]; // Files to create
    modify: string[]; // Files to modify
    delete?: string[]; // Files to delete
  };
  databaseChanges?: string; // If applicable
  environmentChanges?: string; // If applicable
}

export interface AcceptanceCriterion {
  given: string; // Given context
  when: string; // When action occurs
  then: string; // Then expected result
  implementationNotes?: string; // How to test/implement
}

export type QuestionType = 'radio' | 'checkbox' | 'text' | 'select' | 'multiline';

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For radio/checkbox/select
  defaultValue?: string | string[];
  context?: string; // Why we're asking
  impact?: string; // How answer affects spec
}

export interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete';
  lineNumbers?: [number, number]; // For modify
  suggestedContent?: string; // For create
  suggestedChanges?: string; // For modify
  imports?: { add: string[]; remove?: string[] };
  pattern?: string; // Reference to existing pattern to follow
}

export interface TechSpec {
  id: string;
  title: string;
  createdAt: Date;
  problemStatement: ProblemStatement;
  solution: SolutionSection;
  inScope: string[];
  outOfScope: string[];
  acceptanceCriteria: AcceptanceCriterion[];
  clarificationQuestions: ClarificationQuestion[];
  fileChanges: FileChange[];
  qualityScore: number; // 0-100
  ambiguityFlags: string[]; // Issues found during validation
}

export interface TechSpecGenerator {
  generate(input: TechSpecInput): Promise<TechSpec>;
  generateProblemStatement(title: string, description: string, context: CodebaseContext): Promise<ProblemStatement>;
  generateSolution(problem: string, context: CodebaseContext): Promise<SolutionSection>;
  generateAcceptanceCriteria(context: CodebaseContext): Promise<AcceptanceCriterion[]>;
  generateClarificationQuestions(context: CodebaseContext): Promise<ClarificationQuestion[]>;
  generateFileChanges(solution: string, context: CodebaseContext): Promise<FileChange[]>;
  calculateQualityScore(spec: TechSpec): number;
}
```

### Example Usage

```typescript
const generator = new TechSpecGeneratorImpl(llmClient);

const spec = await generator.generate({
  title: 'Add user authentication with Zustand',
  description: 'Implement JWT-based auth flow',
  owner: 'myorg',
  repo: 'myapp',
  githubContext: { tree, files },
  stack: projectStack,
  analysis: codebaseAnalysis,
});

// Returns comprehensive spec with:
// - Problem statement explaining auth needs
// - Solution with specific file paths and line numbers
// - Acceptance criteria in Given/When/Then format
// - Clarification questions (if ambiguities detected)
// - Exact files to create/modify
// - Quality score: 92/100
```

---

## Testing Strategy

- **Unit tests:** Mock LLM responses to test parsing and structure
- **Integration tests (manual):** Test with real LLM to verify quality
- **Fixture responses:** Create sample LLM responses for consistent testing
- **Validation tests:** Verify specs have zero ambiguity
- **Quality scoring tests:** Verify scoring algorithm is consistent

---

## Definition of Done

- [ ] Implementation passes all unit tests (100% coverage)
- [ ] Generates complete, zero-ambiguity specifications
- [ ] LLM integration functional and tested
- [ ] Quality scoring algorithm produces reliable scores
- [ ] Ambiguity detection catches problematic language
- [ ] JSDoc documentation complete with prompt examples
- [ ] Code reviewed and approved
- [ ] Performance acceptable (baseline: <15 seconds for full spec)
- [ ] Works with various project types (tested with 3+ examples)
- [ ] Error handling comprehensive (LLM failures, timeouts, etc.)
