---
name: debug-first
description: Always find root cause before attempting fixes. No guessing, no random patches.
---

# Debug First

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue: test failures, bugs, unexpected behavior, performance problems, build failures.

**Especially when:**
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- You don't fully understand the issue

## The Four Phases

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully** — don't skip past errors. Read stack traces completely. Note line numbers, file paths, error codes.

2. **Reproduce Consistently** — can you trigger it reliably? If not reproducible, gather more data.

3. **Check Recent Changes** — git diff, recent commits, new dependencies, config changes.

4. **Gather Evidence in Multi-Component Systems** — before proposing fixes, add diagnostic instrumentation at each component boundary. Log what enters and exits each layer. Run once to find WHERE it breaks.

5. **Trace Data Flow** — where does the bad value originate? Trace backward through the call stack. Fix at source, not at symptom. See `reference/root-cause-tracing.md`.

### Phase 2: Pattern Analysis

1. **Find Working Examples** — locate similar working code in the codebase
2. **Compare Against References** — read reference implementations COMPLETELY
3. **Identify Differences** — list every difference between working and broken
4. **Understand Dependencies** — what config, environment, assumptions does this code need?

### Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis** — "I think X is the root cause because Y"
2. **Test Minimally** — smallest possible change, one variable at a time
3. **Verify Before Continuing** — didn't work? Form NEW hypothesis. Don't stack fixes.
4. **If 3+ Fixes Failed** — STOP. Question the architecture. This is a design problem, not a code problem.

### Phase 4: Implementation

1. **Create Failing Test Case** — simplest possible reproduction, automated
2. **Implement Single Fix** — address root cause, ONE change, no "while I'm here" improvements
3. **Verify Fix** — test passes? No other tests broken? Issue resolved?

## Red Flags — STOP and Return to Phase 1

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)

## Quick Reference

| Phase | Key Activities | Gate |
|-------|---------------|------|
| 1. Root Cause | Read errors, reproduce, trace | Understand WHAT and WHY |
| 2. Pattern | Find working examples, compare | Identify differences |
| 3. Hypothesis | Form theory, test minimally | Confirmed or new hypothesis |
| 4. Implementation | Create test, fix, verify | Bug resolved, tests pass |
