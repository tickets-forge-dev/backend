# Epic 7: Code-Aware Validation - Summary

**Status:** Planned
**Created:** 2026-02-02
**Priority:** P0 (Critical for v1 quality)

---

## What Was Created

### 1. Epic 7 Added to Epics Document
**Location:** `/docs/epics.md` (lines 1728-2172)

- 7 detailed stories with acceptance criteria
- Technology stack: Mastra v1 Workspace
- Integration with Epic 4 (repo cloning/indexing)
- Integration with Epic 5 (export with findings)

### 2. Sprint Status Updated
**Location:** `/docs/sprint-artifacts/sprint-status.yaml`

All Epic 7 stories added in backlog state:
- `epic-7: backlog`
- `7-1-mastra-workspace-configuration-for-repository-analysis: backlog`
- `7-2-code-analysis-skills-reusable-analysis-patterns: backlog`
- `7-3-pre-implementation-simulation-agent: backlog`
- `7-4-security-analysis-agent: backlog`
- `7-5-architecture-validation-agent: backlog`
- `7-6-concrete-findings-ui-replace-abstract-scores: backlog`
- `7-7-developer-appendix-enhancement-with-analysis-findings: backlog`
- `epic-7-retrospective: optional`

### 3. Architecture Decision Record
**Location:** `/docs/architecture/ADR-007-mastra-workspace-validation.md`

Covers:
- Context and problem statement
- Decision to use Mastra Workspace
- Architecture components and data flow
- Consequences (positive/negative)
- Alternatives considered
- Implementation plan
- Success metrics

### 4. Implementation Guide
**Location:** `/docs/implementation-guides/mastra-workspace-integration.md`

Comprehensive guide including:
- Installation steps
- Workspace architecture
- Code examples (MastraWorkspaceFactory, agents, skills)
- Two complete skills (security-audit, architecture-validation)
- Testing strategy with examples
- Security considerations
- Performance optimization
- Troubleshooting guide

---

## Epic 7 Overview

### Goal
Transform validation from abstract scoring to concrete, developer-ready insights by analyzing actual cloned codebases using Mastra workspace.

### Value Proposition
**Before Epic 7:**
```
Validation Result: Risk score 65/100
Issues: High complexity detected
```

**After Epic 7:**
```
🔴 CRITICAL | Security Gap
Missing security headers middleware

The ticket requires "improve API security" but the helmet
package is not installed in the Express application.

📍 Code location: backend/src/main.ts
💡 Suggestion: Add acceptance criteria:
   "GIVEN the API is running
    WHEN a response is sent
    THEN security headers (X-Frame-Options, CSP) are included"

   Install: npm install helmet
   Add: app.use(helmet())

Evidence: $ npm list helmet
          └── (empty)

[Add to Acceptance Criteria] [Dismiss]
```

### Stories Breakdown

| Story | Title | Complexity |
|-------|-------|------------|
| 7.1 | Mastra Workspace Configuration | Medium |
| 7.2 | Code Analysis Skills | Medium |
| 7.3 | Pre-Implementation Simulation Agent | Large |
| 7.4 | Security Analysis Agent | Medium |
| 7.5 | Architecture Validation Agent | Medium |
| 7.6 | Concrete Findings UI | Large |
| 7.7 | Developer Appendix Enhancement | Small |

**Total Effort:** Large (similar to Epic 2 or Epic 4)

---

## Technology Stack

### Core Dependencies
- **@mastra/core** - Workspace, LocalFilesystem, LocalSandbox
- **zod** - Schema validation for findings
- **GPT-4o or Claude Sonnet** - Analysis agents

### Workspace Features Used
1. **LocalFilesystem** - Read-only access to cloned repos
2. **LocalSandbox** - Execute safe commands (npm, grep, find)
3. **Skills** - Reusable analysis patterns ([agentskills.io](https://agentskills.io))

---

## Key Innovation

**Paradigm Shift:** From static validation to dynamic code analysis

- Validation runs **actual commands** on **real code**
- Findings have **verifiable evidence** (command outputs)
- Suggestions are **actionable** (exact commands, AC to add)
- Analysis is **code-aware** (knows what exists in repo)

**Result:** Tickets as good as what developers get from Claude Code/Cursor

---

## Success Metrics

### Quality
- False alarm rate < 5% (vs. current ~20-30%)
- Developer ticket rejection rate < 10%
- PM confidence score > 4/5

### Performance
- Analysis completes in < 30 seconds (median)
- Workspace creation overhead < 2 seconds (cached)
- LLM token usage < 10k tokens per ticket

### Adoption
- 80%+ of PMs use "Add to Ticket" action
- Concrete findings cited in 90%+ of exported tickets
- Positive developer feedback (qualitative)

---

## Dependencies

### Required (Must Complete First)
- **Epic 4 Complete** - Repository cloning and indexing (already done ✅)

### Optional (Enhanced Experience)
- **Epic 5** - Export to Jira/Linear (for Dev Appendix findings)
- **Epic 6** - Architecture docs (for architecture validation agent)

---

## Implementation Sequence

### Phase 1: Foundation (2-3 days)
- Story 7.1: MastraWorkspaceFactory
- Story 7.2: Security + Architecture skills
- Unit tests for workspace creation

### Phase 2: Analysis Agents (3-4 days)
- Story 7.3: PreImplementationAgent
- Story 7.4: SecurityAnalysisAgent
- Story 7.5: ArchitectureValidationAgent
- Integration tests with forge repo

### Phase 3: UI & Export (2-3 days)
- Story 7.6: ConcreteFindings UI
- Story 7.7: Dev Appendix enhancement
- E2E tests for full flow

**Total Timeline:** ~2 weeks (1 developer) or ~1 week (2 developers)

---

## Security Considerations

### Mitigations Implemented
1. **Read-only filesystem** - Agents can't modify code
2. **Sandbox isolation** - Limited to cloned repo directory
3. **Command whitelist** - Only safe commands allowed (npm list, grep, find)
4. **No user input in commands** - Prevents command injection
5. **Minimal environment** - No sensitive env vars exposed

---

## Files Created Today

1. `/docs/epics.md` - Epic 7 added (444 lines)
2. `/docs/sprint-artifacts/sprint-status.yaml` - Updated with Epic 7 stories
3. `/docs/architecture/ADR-007-mastra-workspace-validation.md` - Architecture decision (340 lines)
4. `/docs/implementation-guides/mastra-workspace-integration.md` - Implementation guide (830 lines)
5. `/docs/EPIC-7-SUMMARY.md` - This summary

**Total:** ~1,600 lines of comprehensive documentation

---

## Next Steps

### Immediate (Before Starting Implementation)
1. Review ADR-007 with team
2. Install Mastra dependencies (`npm install @mastra/core`)
3. Create workspace directory structure
4. Review security considerations

### To Start Development
1. Begin with Story 7.1 (workspace factory)
2. Implement basic skills (security, architecture)
3. Test with forge repository (dogfooding)
4. Iterate based on findings quality

---

## Questions & Discussion

### Key Decision Points
- **Model choice:** GPT-4o (faster) vs Claude Sonnet (better reasoning)?
- **Caching strategy:** Per-repo workspace vs. per-ticket?
- **Skill library:** Start with 4 skills, add more iteratively?

### Open Questions
- Should we allow custom user skills (workspace-level)?
- How to handle monorepos (multiple packages in one repo)?
- Should findings be editable by PMs before export?

---

**Status:** Ready for team review and Epic 7 kickoff planning.

**Contact:** forge team for questions or clarifications.
