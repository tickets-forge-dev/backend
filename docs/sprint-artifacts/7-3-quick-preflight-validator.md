# Story 7.3: Quick Preflight Validator

**Epic:** Epic 7 - Code-Aware Validation & Pre-Implementation Analysis  
**Story ID:** 7.3  
**Created:** 2026-02-03  
**Status:** Ready-for-dev  
**Priority:** P0  
**Effort Estimate:** 6-8 hours

---

## User Story

As a validation system,  
I want a fast preflight validator that checks critical assumptions,  
So that blockers are found in seconds (not minutes) before developers see the ticket.

---

## Performance Requirements (CRITICAL)

- ⏱️ **Execution time:** 10-30 seconds (hard limit: 30s)
- 💰 **Token usage:** 2k-5k tokens (hard limit: 5k)
- 🔧 **Tool calls:** 3-7 max
- 💵 **Cost:** $0.01-$0.05 per ticket

---

## Acceptance Criteria

**Given** an AEC exists and workspace is configured  
**When** the preflight validator runs  
**Then** the agent:
- Parses acceptance criteria to extract TOP 3 critical assumptions only
- For each assumption, runs ONE quick targeted check
- Uses fast commands only: `npm list`, `grep`, `find`, `tsc --noEmit`
- Returns findings ONLY for blockers (skip if everything looks fine)
- Completes within 30 seconds hard limit

**And** agent does NOT:
- ❌ Read more than 5 files
- ❌ Write any code or implementations
- ❌ Run full test suites
- ❌ Explore entire codebase
- ❌ Perform deep analysis

**And** agent generates findings with structure:
```typescript
interface Finding {
  category: 'gap' | 'conflict' | 'missing-dependency' | 'architectural-mismatch';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string; // "helmet package not installed"
  codeLocation?: string; // File path
  suggestion: string; // "Install: pnpm add helmet"
  confidence: number; // 0-1
  evidence?: string; // "$ npm list helmet\n└── (empty)"
}
```

**And** example efficient checks (GitHub API - primary):
- **File exists:** GitHub API getContent('src/main.ts') (1s, 0 tokens) → Found ✅
- **Dependency check:** Parse package.json from GitHub API (2s, 0 tokens) → helmet missing ❌
- **Pattern search:** GitHub Code Search API 'app.use path:src' (3s, 0 tokens) → Found 5 matches ✅
- **Config check:** Check tsconfig.json from GitHub API (1s, 0 tokens) → strict: true ✅

**And** example deep checks (temp clone - fallback for critical issues):
- **Runtime check:** Clone + `npm list helmet` (15s, 0 tokens) → Verify installed version
- **Build check:** Clone + `tsc --noEmit` (20s, 0 tokens) → Verify type safety
- **Pattern analysis:** Clone + `grep -r "useQuery" client/src` (5s, 0 tokens) → Find all usages

**And** example findings (blockers only):
- **Missing dependency:** "helmet package not installed (verified: npm list)"
- **File missing:** "Repo path 'src/domain/user/User.ts' does not exist"
- **Type error:** "Cannot import 'jsonwebtoken' - TypeScript compilation fails"

**And** agent output stored in AEC:
- `preImplementationFindings: Finding[]`
- Augments abstract validation scores from Epic 3
- Used by UI to show concrete blockers

**And** performance is tracked:
- Log execution time, token usage, tool calls
- Alert if exceeds constraints
- Metrics exported for monitoring

---

## Prerequisites

- ✅ Story 7.2: Quick Check Skills - Fast, Targeted Validation Patterns (COMPLETED)
- Skills available for agent to discover and use
- Mastra workspace configured with LocalFilesystem and LocalSandbox
- Finding domain entity exists

---

## Tasks and Subtasks

### Task 1: Create GitHub Validation Service
**Layer:** Infrastructure (GitHub Integration)

**1.1** Create GitHubValidationService
- File: `backend/src/validation/infrastructure/GitHubValidationService.ts`
- Inject GitHubApiService from shared/infrastructure
- Methods: getFileContent(), fileExists(), parsePackageJson(), searchCode()

**1.2** Implement file content fetching
- Use Octokit to fetch file content from GitHub
- Handle 404 errors (file not found)
- Parse JSON files (package.json, tsconfig.json)
- Return raw content for text files

**1.3** Implement code search
- Use GitHub Code Search API for pattern matching
- Query format: 'pattern path:directory language:typescript'
- Return matches with file paths and line numbers
- Handle rate limiting (5000 req/hour)

**1.4** Add error handling
- Catch 404 (file not found) → return null
- Catch 403 (rate limit) → log warning, fallback to temp clone
- Catch 401 (auth failed) → throw error with clear message

**Testing:**
- [ ] Can fetch package.json from public repo
- [ ] Can fetch package.json from private repo (with token)
- [ ] Returns null for non-existent files
- [ ] Code search returns correct results
- [ ] Rate limiting handled gracefully

**Testing:**
- [ ] Agent completes validation in 10-30 seconds
- [ ] Token usage stays under 5k tokens
- [ ] Tool calls limited to 3-7 max
- [ ] Timeout at 30s works correctly
- [ ] Performance metrics logged

---

### Task 2: Enhance QuickPreflightValidator Agent
**Layer:** Application (Validation Agent)

**2.1** Update agent to use GitHub API validation (primary)
- File: `backend/src/validation/agents/QuickPreflightValidator.ts`
- Inject GitHubValidationService
- Implement fast checks using GitHub API (10s budget)
- Extract assumptions from AEC acceptance criteria

**2.2** Add assumption extraction logic
- Parse AEC acceptance criteria
- Extract TOP 3 critical assumptions only
- Prioritize by keywords: 'dependency', 'package', 'file', 'import', 'use'

**2.3** Implement GitHub API validation flow
- Check file existence for referenced files
- Parse package.json to verify dependencies
- Search code patterns using GitHub Code Search
- Generate findings from API results

**2.4** Add temp clone fallback (optional, for critical issues)
- Only trigger if critical blockers found in GitHub API phase
- Budget: 15-20 seconds remaining after GitHub API checks
- Use MastraWorkspaceFactory to create temp workspace
- Run shell commands (npm list, tsc --noEmit, grep)
- Cleanup temp directory after validation

**2.5** Add performance tracking
- Log execution time for GitHub API phase
- Log execution time for temp clone phase (if used)
- Track token usage per validation
- Export metrics for monitoring

**Testing:**
- [ ] Agent completes validation in 10-30 seconds
- [ ] GitHub API checks complete in <10 seconds
- [ ] Temp clone only triggers for critical issues
- [ ] Findings generated from GitHub API results
- [ ] Findings generated from shell commands (temp clone)
- [ ] Finding categorization is accurate
- [ ] Performance metrics logged correctly

---

### Task 3: Add Finding Storage to AEC Domain
**Layer:** Domain + Infrastructure

**3.1** Update AEC domain entity
- File: `backend/src/tickets/domain/aec/AEC.ts`
- Add field: `preImplementationFindings: Finding[]`
- Validation: max 10 findings

**3.2** Update AEC mapper
- File: `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts`
- Map Finding domain objects to Firestore
- Handle null/undefined findings

**3.3** Update Firestore schema
- Path: `/workspaces/{workspaceId}/aecs/{aecId}`
- Add `preImplementationFindings` array field
- Index by `category` and `severity` for queries

**Testing:**
- [ ] AEC entity stores findings array
- [ ] Mapper converts findings correctly
- [ ] Firestore save/load works with findings
- [ ] Can query AECs by finding severity

---

### Task 4: Create ValidateAECWithPreflightUseCase
**Layer:** Application (Use Case)

**4.1** Create new use case
- File: `backend/src/tickets/application/use-cases/ValidateAECWithPreflightUseCase.ts`
- Orchestrates preflight validation flow
- Called optionally after AEC creation (Epic 2)

**4.2** Implement use case logic
- Load AEC by ID
- Get workspace for AEC's repository
- Create QuickPreflightValidator agent
- Run validation with performance constraints
- Store findings in AEC
- Update AEC metadata (validatedAt, preflightRun)

**4.3** Add error handling
- Catch timeout errors → log warning, continue
- Catch workspace errors → skip validation, log
- Catch agent errors → return partial findings

**4.4** Integrate with existing validation pipeline
- Extend ValidationEngine from Epic 3
- Add preflight as optional step
- Runs after abstract validation (scores)
- Findings augment, don't replace scores

**Testing:**
- [ ] Use case loads AEC and workspace correctly
- [ ] Validation completes with findings
- [ ] Findings stored in AEC
- [ ] Timeout errors handled gracefully
- [ ] Integration with ValidationEngine works

---

### Task 5: Add Controller Endpoint for Preflight Validation
**Layer:** Presentation (REST API)

**5.1** Add endpoint to TicketsController
- File: `backend/src/tickets/presentation/controllers/TicketsController.ts`
- POST `/api/tickets/:aecId/validate/preflight`
- Requires auth guard and workspace isolation

**5.2** Create DTO for preflight response
- File: `backend/src/tickets/presentation/dtos/PreflightValidationResponseDto.ts`
- Fields: `findings[]`, `performanceMetrics`, `completedAt`

**5.3** Implement endpoint handler
- Call ValidateAECWithPreflightUseCase
- Map findings to DTO
- Return response with performance metrics

**5.4** Add endpoint documentation
- OpenAPI/Swagger annotations
- Example request/response
- Performance expectations

**Testing:**
- [ ] Endpoint requires authentication
- [ ] Workspace isolation enforced
- [ ] Response includes findings array
- [ ] Performance metrics in response
- [ ] Swagger docs generated

---

### Task 6: Performance Optimization and Constraints Enforcement

**6.1** Implement token usage tracking
- Wrap agent LLM calls with token counter
- Accumulate tokens across validation
- Stop if approaching 5k token limit

**6.2** Implement tool call limiting
- Count tool calls (sandbox executions)
- Stop after 7 tool calls
- Prioritize blocker checks first

**6.3** Add performance alerts
- Log warning if validation takes >25s
- Log error if exceeds 30s timeout
- Track cost per validation ($0.01-$0.05)

**6.4** Optimize agent instructions
- Emphasize "BE FAST. CHECK BLOCKERS ONLY."
- Add examples of efficient vs wasteful checks
- Instruct to skip if no blockers found

**Testing:**
- [ ] Token counter works correctly
- [ ] Validation stops at 5k tokens
- [ ] Tool call limit enforced at 7 calls
- [ ] Performance alerts logged
- [ ] Cost tracking accurate

---

## Dev Notes

### Architecture Context

**Validation Flow:**
```
AEC Created (Epic 2)
  ↓
Abstract Validation (Epic 3) - Scores
  ↓
Preflight Validation (This Story) - Concrete Findings ← NEW
  ↓
UI Shows Scores + Findings
```

**Agent Architecture:**
- QuickPreflightValidator uses Mastra agent framework
- **GitHub API** for fast file/dependency checks (primary - 10s)
- **Temp clone + Mastra Workspace** for deep analysis (fallback - 20s)
- Skills discovered from workspace.skills[] (when using temp clone)
- Findings stored in AEC.preImplementationFindings[]

**Repository Access Strategy:**
- Repositories are NOT persistently cloned to disk (Epic 4 clones temporarily during indexing only)
- Primary validation uses GitHub API for file content, existence checks, code search
- Secondary validation uses temp clone + LocalFilesystem + LocalSandbox for shell commands
- Temp clones cleaned up immediately after validation

**Clean Architecture Layers:**
- **Domain:** Finding entity, AEC entity (updated)
- **Application:** ValidateAECWithPreflightUseCase, QuickPreflightValidator agent
- **Infrastructure:** MastraWorkspaceFactory, AEC repository
- **Presentation:** REST endpoint for preflight validation

### Performance Requirements (CRITICAL)

**Hard Limits:**
- ⏱️ Execution: 30 seconds max
- 💰 Tokens: 5k max
- 🔧 Tool calls: 7 max
- 💵 Cost: $0.05 max

**Enforcement:**
- Promise.race for timeout
- Token counter with early stop
- Tool call counter with limit
- Cost tracking and alerts

**Optimization Strategies:**
- Extract only TOP 3 assumptions (not all)
- One check per assumption (not multiple)
- Fast commands only (npm, grep, find)
- Skip if no blockers found
- Don't read >5 files

### Learnings from Previous Story

**From Story 7.2: Quick Check Skills (Status: ready-for-dev)**

**Skills Created:**
- Security Quick Check: `backend/workspace/skills/security-quick-check/SKILL.md`
- Architecture Quick Check: `backend/workspace/skills/architecture-quick-check/SKILL.md`
- Dependency Quick Check: `backend/workspace/skills/dependency-quick-check/SKILL.md`
- Test Pattern Quick Check: `backend/workspace/skills/test-pattern-quick-check/SKILL.md`

**Skill Format (agentskills.io):**
- Frontmatter: name, description, version, tags, performance
- Performance constraints documented
- Activation criteria (keywords)
- Quick checks with bash commands
- Decision logic (✅ skip / ❌ finding)

**Integration:**
- Skills path configured in MastraWorkspaceFactory: `skills: ['./workspace/skills']`
- Workspace auto-discovers skills
- Agent can call `listAvailableSkills()`
- Skill instructions loaded into agent context

**Reusable for This Story:**
- QuickPreflightValidator will discover and use these skills
- Skills provide efficient validation patterns
- Agent selects relevant skills based on AEC keywords
- Skills ensure fast, targeted checks (1-3 seconds per command)

[Source: stories/7-2-quick-check-skills-fast-targeted-validation-patterns.md]

---

## Change Log

| Date       | Author | Change Description |
|------------|--------|--------------------|
| 2026-02-03 | BMad   | Initial story creation from Epic 7.3 requirements |

---

## Functional Requirements Coverage

**FR5 (Enhanced):** System validates tickets against structural, behavioral, testability, risk, permission criteria with concrete code-aware findings ✅

---

## Dev Agent Record

### Completion Notes
- [ ] QuickPreflightValidator enhanced with skill discovery
- [ ] Performance constraints enforced (30s, 5k tokens, 7 tool calls)
- [ ] Finding domain entity integrated into AEC
- [ ] ValidateAECWithPreflightUseCase implemented
- [ ] REST endpoint created and documented
- [ ] Performance tracking and alerts functional

### Context Reference
- `docs/sprint-artifacts/7-3-quick-preflight-validator.context.xml` - Generated 2026-02-03

### File List
- [To be populated by dev agent during implementation]

---

## Senior Developer Review (AI)
- [To be completed after implementation by code-review workflow]
