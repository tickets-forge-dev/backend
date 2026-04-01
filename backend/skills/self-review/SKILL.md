---
name: self-review
description: Review your own code before submitting. Catch issues before they reach human reviewers.
---

# Self-Review

Review your own work before submitting. Catch issues before they cascade.

**Core principle:** Review early, review often.

## Before Submitting Any Work

### 1. Diff Review

```bash
git diff --stat
git diff
```

For EVERY changed file, ask:
- Is this change intentional?
- Is there any debug code left (console.log, TODO hacks)?
- Are there any commented-out blocks that should be deleted?
- Does the change match what was asked for — nothing more, nothing less?

### 2. Test Review

- Did you run the full test suite? (not just the tests you wrote)
- Are there any skipped tests?
- Did you test edge cases?
- Did you test the unhappy path (errors, empty states, missing data)?

### 3. Architecture Review

- Does this follow the existing patterns in the codebase?
- Are there any cross-layer violations?
- Is the naming consistent with the rest of the code?
- Would a new developer understand this code without extra context?

### 4. Security Review

- Is user input validated?
- Are there any hardcoded secrets?
- Are error messages safe to show to users (no internal details)?
- Is authorization checked, not just authentication?

### 5. Commit Review

- Are commits small and focused?
- Do commit messages explain WHY, not just WHAT?
- Is the branch name descriptive?

## Common Self-Review Catches

| What to look for | Where |
|-----------------|-------|
| Unused imports | Top of every changed file |
| Missing error handling | Every try/catch, every .then() |
| Hardcoded values | Strings, numbers that should be config |
| Missing types | `any` usage, untyped function params |
| Dead code | Functions/vars defined but never called |
| Missing tests | New behavior without test coverage |

## After Self-Review

Log what you found and fixed via record_execution_event. This shows the human reviewer you checked your own work.
