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

We will integrate **Mastra v1 Workspace** to run analysis agents on cloned repositories, transforming validation from abstract scoring to concrete, actionable findings.

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

**1. Mastra Workspace Configuration**
- **LocalFilesystem**: Points to cloned repo directory with `readOnly: true`
- **LocalSandbox**: Enables command execution for analysis (npm, grep, find)
- **Skills**: Reusable analysis patterns following [agentskills.io](https://agentskills.io) spec
- **Tool Safety**: Delete operations disabled, read operations unrestricted

**2. Analysis Agents (not validators)**
- Agents use workspace tools to explore codebase
- Agents simulate implementation mentally (no code generation/execution)
- Agents generate findings with evidence, not scores
- Multiple specialized agents run in parallel (security, architecture, etc.)

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

**Performance Impact:**
- Analysis requires cloned repository (disk space, clone time)
- Sandbox commands add latency (mitigated by caching workspace)
- LLM calls for agents increase cost (but improve quality significantly)

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
- Workspace cached per repository (reused across tickets)
- Parallel agent execution (security, architecture run simultaneously)
- Lazy loading: analysis only runs for tickets affecting indexed repos

**Security:**
- Read-only filesystem prevents code modification
- Sandbox runs in isolated directory (no access to backend code)
- Whitelist of safe commands (npm list, grep, find, git)
- Input sanitization for ticket content used in commands

**Complexity:**
- Comprehensive documentation (this ADR + integration guide)
- Example skills provided (security, architecture, deps, tests)
- Skills use standard agentskills.io spec (community support)

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
- Implement `MastraWorkspaceFactory`
- Configure LocalFilesystem + LocalSandbox for repositories
- Create 4 core skills (security, architecture, deps, tests)
- Integration tests for workspace creation/cleanup

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
