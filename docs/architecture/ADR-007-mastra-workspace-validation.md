# ADR-007: Mastra Workspace for Code-Aware Validation

**Status:** Proposed
**Date:** 2026-02-02
**Authors:** forge team
**Epic:** Epic 7 - Code-Aware Validation & Pre-Implementation Analysis

---

## Context

The current validation system (Epic 3) provides abstract scores (0-100) based on structural, behavioral, testability, risk, and permissions criteria. While functional, these scores don't give Product Managers or developers concrete, actionable insights.

**Problems with abstract validation:**
- PM sees "Risk score: 65" but doesn't know what to fix
- Developers receive tickets that assume code patterns that don't exist
- No way to verify ticket assumptions against actual codebase
- Validation is static - doesn't analyze real code
- False alarms: tickets that look good but fail during implementation

**User feedback:**
> "If the developer gets a ticket that is not baked enough and Claude Code could give them better results, they'll look at our system as a false alarm and avoid everything in this ticket."

**Goal:**
Make validation at least as good as what a developer gets using Claude Code or Cursor directly by analyzing the actual cloned codebase.

---

## Decision

We will integrate **Mastra v1 Workspace** to run **Quick Preflight Validators** on cloned repositories, transforming validation from abstract scoring to concrete, actionable findings.

### Critical Constraint: Speed & Efficiency

**This is NOT a full implementation tool.** We're building a **fast preflight check system**, not another Claude Code.

**Why:**
- Full implementation = 5-30 minutes, 50k-200k tokens (too slow/expensive)
- Preflight validation = 10-30 seconds, 2k-5k tokens (fast/cheap)
- Must provide value BEYOND "just use Claude Code yourself"

**Strategy:**
- ✅ Validate critical assumptions only (not full implementation)
- ✅ Quick targeted checks (5 checks max, 30 seconds)
- ✅ Catch blockers early (before developer starts)
- ✅ Skip everything that looks fine
- ❌ Don't explore entire codebase
- ❌ Don't write complete implementations
- ❌ Don't run full test suites

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Validation Pipeline                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Abstract Validators (Epic 3)                   │
│  - Structural Validator                                     │
│  - Behavioral Validator                                     │
│  - Testability Validator                                    │
│  - Risk Validator                                           │
│  - Permissions Validator                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Mastra Workspace Analysis (Epic 7) - NEW            │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ MastraWorkspaceFactory                                │  │
│  │  - Creates workspace per repository                   │  │
│  │  - LocalFilesystem (read-only)                        │  │
│  │  - LocalSandbox (command execution)                   │  │
│  │  - Skills (security, architecture, deps, tests)       │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Analysis Agents                                       │  │
│  │  - PreImplementationAgent                             │  │
│  │  - SecurityAnalysisAgent                              │  │
│  │  - ArchitectureValidationAgent                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Findings Generator                                    │  │
│  │  - Concrete issues (not scores)                       │  │
│  │  - Code locations                                     │  │
│  │  - Actionable suggestions                             │  │
│  │  - Evidence (command outputs)                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AEC with Findings                        │
│  - validationResults: ValidationResult[] (abstract)         │
│  - preImplementationFindings: Finding[] (concrete)          │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

**1. Hybrid Repository Access Strategy**
- **Primary: GitHub API** (10s) - Fast file/dependency checks without cloning
  - File existence and content fetching via Octokit
  - Package.json dependency parsing
  - GitHub Code Search for pattern matching
  - Zero disk space, minimal latency
- **Fallback: Temporary Clone + Mastra Workspace** (20s) - Deep analysis when needed
  - LocalFilesystem: Points to temp clone with `readOnly: true`
  - LocalSandbox: Enables command execution (npm list, tsc, grep)
  - Skills: Reusable analysis patterns following [agentskills.io](https://agentskills.io) spec
  - Immediate cleanup after validation

**2. Quick Preflight Validators (not full implementers)**
- Agents validate critical assumptions only (3-5 checks max)
- Primary validation via GitHub API (fast, no clone needed)
- Secondary validation via temp clone only for critical blockers
- Agents generate findings with evidence, not scores
- Execution time: 10-30 seconds total, 2k-5k tokens
- Multiple validators can run in parallel for different focus areas

**3. Finding Structure**
```typescript
interface Finding {
  category: 'gap' | 'conflict' | 'missing-dependency' | 'architectural-mismatch';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  codeLocation?: string; // File path or GitHub link
  suggestion: string; // What to add to ticket
  confidence: number; // 0-1
  evidence?: string; // Command output proving the issue
}
```

**4. Integration with Existing System**
- Abstract validators (Epic 3) still run for backward compatibility
- Mastra analysis augments (not replaces) existing validation
- Findings stored in AEC alongside validation results
- UI prioritizes findings over scores

---

## Consequences

### Positive

**For Product Managers:**
- Concrete feedback: "Install helmet package" instead of "Risk score: 65"
- Actionable suggestions with exact AC to add
- Higher confidence that tickets are implementation-ready
- "Add to Ticket" button auto-injects suggestions into AEC

**For Developers:**
- Tickets include pre-implementation analysis with real code context
- No surprises: gaps/conflicts caught before implementation
- Better than manual Claude Code usage (automated analysis)
- Dev Appendix includes findings with code locations

**For the System:**
- Eliminates false alarms (validation based on real code)
- Scales to any tech stack (agents discover patterns dynamically)
- Skills are reusable and extensible
- Analysis improves as skills evolve

### Negative

**Performance Impact (MITIGATED):**
- Primary validation uses GitHub API only (no cloning needed - 10s)
- Fallback temp clone only for critical issues (15-20s, cleaned immediately)
- Epic 4 indexing already handles repository cloning (for vector DB)
- Quick validation: 10-30 seconds total (acceptable for ticket creation flow)
- Token usage: 2k-5k per ticket (manageable cost: ~$0.01-0.03 per ticket)
- No persistent storage needed (GitHub API + temp clones)

**Complexity:**
- Mastra workspace adds new dependency and learning curve
- Agent prompt engineering required for accurate findings
- Skills need maintenance as coding patterns evolve

**Security:**
- Sandbox executes commands on cloned code (read-only mitigates risk)
- Need to prevent command injection via ticket content
- Skills must be reviewed to prevent malicious commands

### Mitigations

**Performance:**
- GitHub API validation first (fast, no cloning)
- Temp clone only when absolutely necessary (critical blockers)
- Parallel agent execution possible (security, architecture can run simultaneously)
- Lazy loading: analysis only runs for tickets affecting indexed repos

**Security:**
- GitHub API uses OAuth tokens (scoped to repository access)
- Read-only filesystem prevents code modification (temp clones)
- Sandbox runs in isolated temp directory (no access to backend code)
- Whitelist of safe commands (npm list, grep, find, tsc)
- Input sanitization for ticket content used in commands
- Temp directories cleaned immediately after validation

**Complexity:**
- Comprehensive documentation (this ADR + integration guide)
- Example skills provided (security, architecture, deps, tests)
- Skills use standard agentskills.io spec (community support)

---

## Performance Constraints

**Non-Negotiable Requirements:**

| Metric | Target | Max Acceptable |
|--------|--------|----------------|
| **Execution Time** | 10-20 seconds | 30 seconds |
| **Token Usage** | 2k-3k tokens | 5k tokens |
| **Tool Calls** | 3-5 calls | 7 calls |
| **Cost per Ticket** | $0.01-0.02 | $0.05 |
| **Files Read** | 2-5 files | 10 files |

**Strategy to Meet Constraints:**

1. **GitHub API First** - Fast file/dependency checks without cloning (10s)
2. **Targeted Validation** - Only check TOP 3 critical assumptions from AC
3. **Smart Fallback** - Temp clone only for critical blockers (15-20s)
4. **Early Exit** - Stop on first blocker, don't validate everything
5. **Command Efficiency** - One command per assumption (npm list, grep, tsc)
6. **Token Optimization** - Minimal prompts, structured output only

**Example Performance Profile:**
```
Ticket: "Add helmet security headers"

Phase 1: GitHub API Checks (10s)
1. Check package.json exists          → 1s, 0 tokens (GitHub API)
2. Parse dependencies                 → 1s, 0 tokens (JSON parse)
3. Search for helmet usage            → 3s, 0 tokens (GitHub Code Search)
4. Agent analysis (GitHub results)    → 5s, 2k tokens (LLM call)

Finding: helmet not in dependencies → CRITICAL BLOCKER

Phase 2: Temp Clone Verification (15s) - SKIPPED (GitHub API sufficient)

Total: 10s, 2k tokens, $0.012 ✅
```

**Example with Temp Clone Fallback:**
```
Ticket: "Upgrade React Query v4 → v5"

Phase 1: GitHub API Checks (8s)
1. Check package.json                 → 2s, 0 tokens
2. Found: "@tanstack/react-query": "^4.29.0" → POTENTIAL BLOCKER
3. Search for useQuery usage          → 3s, 0 tokens
4. Agent analysis                     → 3s, 1.5k tokens

Finding: React Query v4 detected, need to verify if v5 compatible

Phase 2: Temp Clone Deep Check (17s) - TRIGGERED (verify compatibility)
1. Clone repo                         → 8s, 0 tokens
2. npm list @tanstack/react-query     → 3s, 0 tokens (verify installed)
3. tsc --noEmit                       → 4s, 0 tokens (type check)
4. Agent synthesis                    → 2s, 1k tokens
5. Cleanup temp dir                   → <1s, 0 tokens

Total: 25s, 2.5k tokens, $0.015 ✅
```

---

## Alternatives Considered

### Alternative 1: Static Analysis Tools (ESLint, SonarQube)
**Pros:**
- Fast, deterministic
- No LLM costs

**Cons:**
- Language-specific (need different tools for each stack)
- Can't understand ticket context
- Provides lint errors, not ticket validation findings
- Doesn't simulate implementation

**Decision:** Rejected - too rigid, doesn't solve "ticket vs. code" mismatch

### Alternative 2: LLM Analysis without Sandbox
**Pros:**
- Simpler architecture
- No command execution risks

**Cons:**
- LLM can't verify code actually exists (hallucinates)
- No evidence to support findings (just LLM opinion)
- Can't run npm list, grep, find to check dependencies/patterns

**Decision:** Rejected - findings need verifiable evidence

### Alternative 3: Manual Developer Review
**Pros:**
- Human expertise
- No automation complexity

**Cons:**
- Doesn't scale (blocks developers)
- Expensive (developer time)
- Defeats purpose (we want to reduce developer burden)

**Decision:** Rejected - automation is the goal

---

## Implementation Plan

### Phase 1: Foundation (Story 7.1-7.2)
- Implement `GitHubValidationService` for API-based validation
- Implement `MastraWorkspaceFactory` for temp clone fallback
- Configure LocalFilesystem + LocalSandbox for temp clones
- Create 4 core skills (security, architecture, deps, tests)
- Integration tests for GitHub API + temp clone cleanup

### Phase 2: Analysis Agents (Story 7.3-7.5)
- Implement PreImplementationAgent (general simulation)
- Implement SecurityAnalysisAgent (security-specific)
- Implement ArchitectureValidationAgent (architecture-specific)
- Unit tests with mock workspace

### Phase 3: UI & Export (Story 7.6-7.7)
- Build ConcreteFindings UI component
- Add "Add to Ticket" action
- Enhance Dev Appendix with findings
- E2E tests for full validation flow

---

## Success Metrics

**Quality Metrics:**
- False alarm rate < 5% (vs. current estimated 20-30%)
- Developer ticket rejection rate < 10%
- PM confidence score (survey) > 4/5

**Performance Metrics:**
- Analysis completes in < 30 seconds (median)
- Workspace creation overhead < 2 seconds (cached)
- LLM token usage < 10k tokens per ticket

**Adoption Metrics:**
- 80%+ of PMs use "Add to Ticket" action
- Concrete findings cited in 90%+ of exported tickets
- Developer feedback positive (qualitative survey)

---

## References

- [Mastra Workspace Documentation](https://mastra.ai/docs/workspace/overview)
- [Agent Skills Specification](https://agentskills.io)
- [Epic 7: Code-Aware Validation](../epics.md#epic-7-code-aware-validation--pre-implementation-analysis)
- [Epic 3: Abstract Validation](../epics.md#epic-3-clarification--validation)

---

## Revision History

| Date       | Version | Changes                    | Author      |
|------------|---------|----------------------------|-------------|
| 2026-02-02 | 1.0     | Initial ADR                | forge team  |
