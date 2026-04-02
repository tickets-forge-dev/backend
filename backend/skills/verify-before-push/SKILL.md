# Verify Before Push

## Mandatory Verification Gate

Before committing and pushing ANY code, you MUST run these checks in order.
Do NOT commit or push until ALL checks pass.

### Step 1: Build Check
```bash
npm run build 2>&1 || echo "BUILD_FAILED"
```
If the project has a build script, it must exit 0.
If there is no build script, skip this step.

### Step 2: Type Check (TypeScript projects only)
```bash
npx tsc --noEmit 2>&1 || echo "TYPECHECK_FAILED"
```
Skip if the project does not use TypeScript (no tsconfig.json).

### Step 3: Lint Check
```bash
npm run lint 2>&1 || echo "LINT_FAILED"
```
If the project has a lint script, it must exit 0.
If there is no lint script, skip this step.

### Step 4: Test Check
```bash
npm test 2>&1 || echo "TESTS_FAILED"
```
If the project has a test script, it must exit 0.
If there is no test script, skip this step.

## On Failure

If ANY check fails:
1. Read the error output carefully
2. Fix the issue in your code
3. Re-run ALL checks from the beginning
4. Maximum 3 fix attempts per check

If still failing after 3 attempts:
- Do NOT push the code
- Report the failure via `record_execution_event` with type 'risk'
- Call `submit_settlement` with a note about what failed and why

## On Success

When all checks pass:
1. Log success via `record_execution_event`: "All verification checks passed: build ✓, types ✓, lint ✓, tests ✓"
2. Commit your changes
3. Push to the remote branch
4. Call `submit_settlement`

## Key Rule

**Never push code that doesn't build, doesn't type-check, doesn't lint, or doesn't pass tests.**
A broken PR is worse than no PR.
