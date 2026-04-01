---
name: tdd
description: Write tests first, watch them fail, then implement — red-green-refactor cycle
---

# Test-Driven Development

Every feature and bugfix follows the red-green-refactor cycle. No implementation code without a failing test first.

## The Cycle

1. **Red** — Write a test that describes the behavior. Run it. It must fail.
2. **Green** — Write the minimum code to make the test pass. Nothing more.
3. **Refactor** — Clean up. Tests still pass.
4. **Commit** — Small, focused commit after each green.

## Before Writing Code

Detect the test runner and verify it works:
```bash
bash scripts/run-tests.sh --detect
```

Review `reference/test-patterns.md` for patterns in the project's test framework.

## Rules

- Never write implementation before the test
- If the test passes immediately, the test is wrong
- One behavior per test — name tests after what they verify, not what they call
- Mock at boundaries only (external APIs, databases) — not internal modules
- Test the contract, not the implementation

## During Implementation

For each behavior:
1. Write the test → run `bash scripts/run-tests.sh` → verify FAIL
2. Implement → run `bash scripts/run-tests.sh` → verify PASS
3. Refactor → run `bash scripts/run-tests.sh` → verify PASS
4. Commit

## After Implementation

Run the full test suite:
```bash
bash scripts/run-tests.sh --all
```
