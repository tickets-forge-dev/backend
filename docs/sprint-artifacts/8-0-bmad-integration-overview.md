# Epic 8: BMAD Tech-Spec Integration - Complete Overview

## The Problem We're Solving

**Current state:** The system produces generic, useless output that's no better than ChatGPT.

**Root cause:** We don't read actual code. We use vector search snippets that lack context.

**Solution:** Implement BMAD tech-spec methodology with direct GitHub file reading.

---

## Documents Created

| Doc | Purpose |
|-----|---------|
| **8-0** (this) | Overview and starting point |
| **8-2** | Original integration plan (outdated by 8-3) |
| **8-3** | Complete Mastra implementation spec |
| **8-4** | Migration plan + architecture |
| **8-5** | UI wireframes for all stages |

---

## Key Decision: How Questions Work

**BMAD is conversational. Our platform is NOT a chat.**

We replace chat with a **4-stage wizard**:

```
Stage 1: Input      → User enters title/description (existing)
Stage 2: Context    → System shows what it found, user confirms
Stage 3: Draft      → System shows spec + questions as forms
Stage 4: Review     → User approves final ticket
```

Questions appear as **form fields** (radio buttons, checkboxes), not chat messages.

---

## Architecture Summary

```
┌─────────────────────┐
│   FRONTEND          │
│   GenerationWizard  │  ← 4 stages
│   (React)           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   BACKEND           │
│   Tech-Spec Workflow│  ← 7 Mastra steps
│   (NestJS + Mastra) │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌────────┐  ┌────────┐
│ GitHub │  │ Claude │
│  API   │  │  API   │
└────────┘  └────────┘
```

---

## Services to Create

| Service | Purpose |
|---------|---------|
| `GitHubFileService` | Read files via GitHub API |
| `ProjectStackDetector` | Detect framework, versions |
| `CodebaseAnalyzer` | Analyze patterns, conventions |
| `TechSpecGenerator` | Core LLM generation |
| `StoryGenerator` | Break spec into AC/tasks |

---

## What We Remove

| Remove | Reason |
|--------|--------|
| Firebase indexing | Replaced by GitHub file reading |
| `IndexQueryService` | No longer needed |
| `MastraContentGenerator.extractIntent/detectType/generateDraft` | Replaced by TechSpecGenerator |
| `FindingsToQuestionsAgent` | Questions come from tech spec |
| 6 of 12 workflow steps | Consolidated into BMAD flow |

---

## Implementation Order

### Phase 1: Backend Services
1. `GitHubFileService` - File reading
2. `ProjectStackDetector` - Stack detection
3. `CodebaseAnalyzer` - Pattern analysis
4. `TechSpecGenerator` - Core generation

### Phase 2: Workflow
5. Create new tech-spec workflow
6. Add feature flag `USE_TECH_SPEC_WORKFLOW`

### Phase 3: Frontend
7. `ContextReviewStage` component
8. `DraftReviewStage` component
9. `QuestionsForm` component
10. `GenerationWizard` container
11. Update store for multi-stage

### Phase 4: Cleanup
12. Remove indexing code
13. Remove old workflow
14. Remove feature flag

---

## Success Criteria

After implementation, tickets should:

1. ✅ Reference **actual files** from the codebase
2. ✅ Use **exact versions** from package.json
3. ✅ Follow **existing patterns** in the code
4. ✅ Provide **specific file paths** with actions
5. ✅ Have **zero ambiguity** (no "or" statements)
6. ✅ Include **code-aware questions**

---

## Quick Links

- [Implementation Spec](./8-3-bmad-mastra-implementation-spec.md) - Technical details
- [Migration Plan](./8-4-bmad-migration-plan.md) - Architecture + steps
- [UI Wireframes](./8-5-bmad-ui-wireframes.md) - All screen designs

---

## Ready to Start

The documentation is complete. To begin:

1. Read the [wireframes](./8-5-bmad-ui-wireframes.md) to understand the UX
2. Review the [implementation spec](./8-3-bmad-mastra-implementation-spec.md) for technical details
3. Start with `GitHubFileService` (no dependencies)

**The core insight:** We're not building a chat. We're building a wizard where each stage is a review point. Questions are forms, not conversations. This is actually **better UX** than chat.
