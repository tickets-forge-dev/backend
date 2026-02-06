# Story 8.2 - BMAD Tech-Spec Integration Plan

## Executive Summary

Current system produces **generic, context-free output** because it:
1. Doesn't read actual code files
2. Uses only vector search snippets (limited context)
3. Generates acceptance criteria from description alone (like ChatGPT)

**BMAD tech-spec** solves this by:
1. Reading actual source files via GitHub API / file tools
2. Analyzing existing patterns, imports, dependencies
3. Generating code-aware specifications with file-by-file implementation guidance

---

## Current 12-Step Workflow Analysis

| Step | Name | What It Does | LLM Calls | Code-Aware? |
|------|------|--------------|-----------|-------------|
| 0 | Initialize & Lock | Lock AEC, validate index ready | 0 | ❌ |
| 1 | Extract Intent | Parse title/description for intent + keywords | 1 | ❌ |
| 2 | Detect Type | Classify as FEATURE/BUG/REFACTOR/CHORE/SPIKE | 1 | ❌ |
| 3 | Preflight Validation | Run QuickPreflightValidator on AEC | 1 | ⚠️ Limited |
| 4 | Review Findings | SUSPENSION if critical findings | 0 | ❌ |
| 5 | Gather Repo Context | Query IndexQueryService for snippets | 0 | ⚠️ Vector only |
| 6 | Gather API Context | TODO - not implemented | 0 | ❌ |
| 7 | Draft Ticket | Generate AC, assumptions, repoPaths | 1 | ⚠️ Uses snippets |
| 8 | Generate Questions | Identify gaps, create questions | 1 | ❌ |
| 9 | Ask Questions | SUSPENSION for user answers | 0 | ❌ |
| 10 | Refine Draft | Incorporate answers into draft | 1 | ❌ |
| 11-12 | Finalize | Save to AEC, unlock | 0 | ❌ |

**Total LLM Calls:** 6 (but shallow, no deep code analysis)

---

## BMAD Tech-Spec Capabilities

The `bmad:bmm:workflows:tech-spec` workflow provides:

1. **Deep Code Analysis**
   - Reads actual source files (not just snippets)
   - Identifies existing patterns, conventions, imports
   - Maps dependencies and affected modules

2. **Structured Output**
   - Technical specification with rationale
   - Implementation plan (file-by-file)
   - Risk assessment and edge cases
   - Acceptance criteria derived from actual code structure

3. **Pattern Recognition**
   - Identifies how similar features are implemented
   - Follows existing architectural patterns
   - Respects coding conventions in the codebase

4. **Questions & Assumptions**
   - Code-informed questions (not generic)
   - Assumptions grounded in actual implementation details

---

## Integration Mapping: Current Steps → BMAD

### Steps to **KEEP** (Infrastructure/HITL)

| Step | Reason |
|------|--------|
| **0: Initialize & Lock** | Essential for workflow state management |
| **3-4: Preflight Validation + Review** | Quality gate before generation |
| **9: Ask Questions** | HITL pattern for user interaction |
| **11-12: Finalize** | Persistence layer to AEC |

### Steps to **REPLACE** with BMAD Tech-Spec

| Current Step | Replaced By | Rationale |
|--------------|-------------|-----------|
| **1: Extract Intent** | BMAD initial analysis | BMAD extracts intent WITH code context |
| **2: Detect Type** | BMAD classification | BMAD determines type based on scope of changes |
| **5: Gather Repo Context** | BMAD file reading | BMAD reads actual files, not just snippets |
| **6: Gather API Context** | BMAD analysis | BMAD identifies external deps from imports |
| **7: Draft Ticket** | BMAD tech-spec output | Core replacement - produces real AC |
| **8: Generate Questions** | BMAD questions | Code-informed questions |
| **10: Refine Draft** | BMAD iteration | Can incorporate answers into next pass |

---

## New Workflow Architecture (Post-BMAD Integration)

```
┌─────────────────────────────────────────────────────────────────┐
│                    BMAD-ENHANCED WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: INITIALIZATION                                         │
│  ├─ Step 0: Initialize & Lock (KEEP)                            │
│  │   └─ Lock AEC, validate workspace                            │
│  │                                                               │
│  PHASE 2: PREFLIGHT (KEEP - Quality Gate)                       │
│  ├─ Step 1: Quick Preflight Validation (KEEP, renumber)         │
│  ├─ Step 2: Review Critical Findings (KEEP, SUSPENSION)         │
│  │                                                               │
│  PHASE 3: BMAD TECH-SPEC (NEW - Replaces Steps 1-2, 5-8)        │
│  ├─ Step 3: BMAD Tech-Spec Agent                                │
│  │   ├─ Input: title, description, repository context           │
│  │   ├─ Tools: GitHub file reading, grep, glob                  │
│  │   ├─ Process:                                                │
│  │   │   1. Analyze request → identify scope                    │
│  │   │   2. Read relevant files (actual code)                   │
│  │   │   3. Identify patterns, conventions                      │
│  │   │   4. Generate tech spec + implementation plan            │
│  │   │   5. Derive AC from actual requirements                  │
│  │   │   6. Identify questions/assumptions                      │
│  │   └─ Output: TechSpec document                               │
│  │                                                               │
│  PHASE 4: HITL QUESTIONS (KEEP - but with BMAD questions)       │
│  ├─ Step 4: Present Questions (from BMAD output)                │
│  │   └─ SUSPENSION if questions exist                           │
│  │                                                               │
│  PHASE 5: FINALIZATION (KEEP)                                   │
│  ├─ Step 5: Map TechSpec → AEC fields                           │
│  │   ├─ type ← TechSpec.changeType                              │
│  │   ├─ acceptanceCriteria ← TechSpec.requirements              │
│  │   ├─ assumptions ← TechSpec.assumptions                      │
│  │   ├─ repoPaths ← TechSpec.affectedFiles                      │
│  │   ├─ questions ← TechSpec.openQuestions                      │
│  │   └─ estimate ← TechSpec.complexity                          │
│  │                                                               │
│  └─ Step 6: Finalize & Unlock (KEEP)                            │
│      └─ Save to Firestore, unlock AEC                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Code Cleanup Required

### Files to Modify

| File | Changes |
|------|---------|
| `ticket-generation.workflow.ts` | Remove steps 1-2, 5-8, 10; Add BMAD step |
| `MastraContentGenerator.ts` | Remove or deprecate `extractIntent`, `detectType`, `generateDraft` |
| `FindingsToQuestionsAgent.ts` | Remove or deprecate (BMAD generates questions) |

### Objects/Services to Remove

```typescript
// MastraContentGenerator methods to remove:
- extractIntent()      // Replaced by BMAD analysis
- detectType()         // Replaced by BMAD changeType
- generateDraft()      // Replaced by BMAD tech-spec
- refineDraft()        // Replaced by BMAD iteration

// Workflow state fields possibly unused:
- intent              // BMAD handles internally
- keywords            // BMAD handles internally
- repoContext         // BMAD reads files directly
- apiContext          // Never implemented anyway
```

### New Services to Create

```typescript
// New agent service
interface BMADTechSpecAgent {
  generateTechSpec(input: {
    title: string;
    description: string;
    repositoryFullName: string;
    branchName?: string;
  }): Promise<TechSpecResult>;
}

// Output structure
interface TechSpecResult {
  changeType: 'FEATURE' | 'BUG' | 'REFACTOR' | 'CHORE';
  summary: string;
  requirements: Array<{
    id: string;
    description: string;
    rationale: string;
  }>;
  affectedFiles: Array<{
    path: string;
    action: 'create' | 'modify' | 'delete';
    description: string;
  }>;
  implementationPlan: Array<{
    step: number;
    description: string;
    files: string[];
  }>;
  assumptions: string[];
  openQuestions: Array<{
    id: string;
    question: string;
    options?: string[];
    defaultAssumption?: string;
  }>;
  risks: Array<{
    description: string;
    mitigation: string;
  }>;
  complexity: {
    estimate: 'low' | 'medium' | 'high';
    rationale: string;
  };
}
```

---

## Implementation Approach

### Option A: Invoke BMAD CLI (Subprocess)

```typescript
// Shell out to BMAD installed locally
const result = await execAsync(`bmad tech-spec --input "${input}" --repo "${repo}"`);
```

**Pros:** Uses actual BMAD, full capability
**Cons:** Requires BMAD CLI installed, subprocess management, output parsing

### Option B: Port BMAD Logic to Mastra Agent

```typescript
// Create a Mastra agent that follows BMAD patterns
const techSpecAgent = createMastraAgent({
  name: 'TechSpecAgent',
  tools: [githubFileRead, grep, glob],
  instructions: BMAD_TECH_SPEC_INSTRUCTIONS,
});
```

**Pros:** Native integration, better control
**Cons:** Need to port BMAD prompts/logic

### Option C: Hybrid - Use BMAD Skill via Claude Code (Recommended)

Since we have the BMAD skill `bmad:bmm:workflows:tech-spec` available, we can:

1. Create a backend service that invokes Claude with BMAD skill
2. Pass repository context and let BMAD do the analysis
3. Parse structured output and map to AEC

```typescript
// Backend invokes Claude API with BMAD skill context
const techSpec = await claudeService.invoke({
  skill: 'bmad:bmm:workflows:tech-spec',
  input: {
    title,
    description,
    repository: repoContext,
  },
  tools: [githubFileRead],  // Give Claude access to read files
});
```

---

## Step-by-Step Integration Plan

### Phase 1: Preparation (Clean Up)
1. [ ] Identify all usages of `extractIntent`, `detectType`, `generateDraft`
2. [ ] Mark deprecated but don't remove yet
3. [ ] Add feature flag: `USE_BMAD_TECH_SPEC`

### Phase 2: BMAD Agent Implementation
1. [ ] Create `TechSpecAgent` service
2. [ ] Implement GitHub file reading tools
3. [ ] Port BMAD tech-spec instructions
4. [ ] Create `TechSpecResult` → AEC mapping

### Phase 3: Workflow Modification
1. [ ] Add BMAD step to workflow
2. [ ] Remove redundant steps (behind feature flag)
3. [ ] Update workflow state schema
4. [ ] Test end-to-end

### Phase 4: Cleanup
1. [ ] Remove deprecated code
2. [ ] Remove feature flag
3. [ ] Update documentation

---

## Field Mapping: TechSpec → AEC

| TechSpec Field | AEC Field | Transformation |
|----------------|-----------|----------------|
| `changeType` | `type` | Direct mapping |
| `requirements[].description` | `acceptanceCriteria[]` | Extract descriptions |
| `assumptions[]` | `assumptions[]` | Direct |
| `affectedFiles[].path` | `repoPaths[]` | Extract paths |
| `openQuestions[]` | `questions[]` | Map to Question format |
| `complexity.estimate` | `estimate` | Map to Estimate value object |
| `risks[]` | `preImplementationFindings[]` | Map to Finding format |

---

## UI Considerations

The current UI expects these AEC fields:
- `title`, `description`
- `type` (FEATURE, BUG, etc.)
- `acceptanceCriteria[]`
- `assumptions[]`
- `repoPaths[]`
- `questions[]`
- `estimate`
- `preImplementationFindings[]`
- `validationResults[]`

**BMAD output will populate all these.** The UI doesn't need changes, only the backend workflow.

### Enhanced UI (Future)
With BMAD's richer output, we could show:
- Implementation plan (step-by-step)
- Affected files with actions (create/modify/delete)
- Risk assessment
- Complexity rationale

---

## Success Criteria

After BMAD integration, generated tickets should:

1. **Reference actual files** from the codebase
2. **Follow existing patterns** identified in the code
3. **Provide implementation guidance** based on real structure
4. **Ask specific questions** based on code analysis
5. **Estimate accurately** based on scope of changes

---

## Dependencies

- [ ] User provides BMAD tech-spec workflow file for reference
- [ ] GitHub API access for file reading
- [ ] Claude API with tool use capability
- [ ] Feature flag infrastructure

---

## Timeline

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1 | Cleanup prep | Low |
| Phase 2 | BMAD Agent | Medium-High |
| Phase 3 | Workflow integration | Medium |
| Phase 4 | Final cleanup | Low |

---

## Next Steps

1. **Receive BMAD tech-spec workflow file** from user
2. Analyze exact prompts and tool usage
3. Decide on implementation approach (A/B/C)
4. Begin Phase 1 cleanup
