# Sandbox Verification Gate — Design Ticket

**Date:** 2026-04-01
**Status:** Backlog
**Priority:** High
**Type:** Feature

## Problem

The Cloud Develop sandbox pushes code and creates PRs without verifying the code works. AI agents can introduce broken imports, missing assets, syntax errors, or failing tests — all of which get pushed to GitHub and create broken PRs.

Example: Agent imported `./assets/react.svg` but never created the file → broken build.

## Solution

Add a **verification gate** in the sandbox before push. The agent must pass all checks before the code is committed and pushed:

### Verification Steps (in order)

1. **Build check** — `npm run build` (or equivalent) must exit 0
2. **Lint check** — `npm run lint` (if exists) must exit 0
3. **Test check** — `npm test` (if exists) must exit 0
4. **Type check** — `npx tsc --noEmit` (if TypeScript) must exit 0

### Behavior

- **All pass** → push code, create PR, report success
- **Any fail** → agent gets error output, attempts to fix, re-runs checks (max 3 retries)
- **Still failing after retries** → report partial completion with errors, do NOT push broken code
- **No build script** → skip build check (not all projects have one)

### Implementation Location

`backend/src/sessions/infrastructure/container/system-prompt.txt` — add verification instructions to Claude's system prompt so it runs checks before committing.

`backend/src/sessions/application/services/SessionOrchestrator.ts` — optionally validate the exit event includes test results.

### What This Prevents

- Broken imports (missing files)
- Syntax errors
- Type errors in TypeScript projects
- Failing tests
- Lint violations

## Acceptance Criteria

- [ ] Agent runs build/lint/test/typecheck before pushing
- [ ] If checks fail, agent attempts to fix (up to 3 retries)
- [ ] Broken code is never pushed to GitHub
- [ ] Verification results are included in the Change Record
- [ ] Session summary shows verification status (passed/failed)
