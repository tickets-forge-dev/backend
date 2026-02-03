---
name: test-pattern-quick-check
description: Fast test structure verification (does NOT run tests)
version: 1.0.0
tags: [testing, validation, quick-check, jest, vitest]
performance: fast-only
---

# Test Pattern Quick Check

**CRITICAL: This is a FAST validator for test setup, NOT a test runner. Do not run test suites.**

**Performance Constraints:**
- Maximum 3 commands per validation
- Each command must complete in 1-3 seconds
- Pattern verification only - don't run tests
- Skip if AC doesn't mention testing

**When to activate:**
- Ticket AC mentions: "test", "testing", "unit test", "integration test", "test coverage"
- Keywords: "Jest", "Vitest", "spec", "describe", "it", "expect"
- Ticket type: Feature requiring new tests

**Quick checks to run:**

1. **Find test files** (if AC mentions tests):
   ```bash
   find . -name "*.spec.ts" -o -name "*.test.ts" | head -10
   ```
   ✅ Test files exist → skip, no finding
   ❌ No tests found → create finding
   
   Example finding:
   ```
   category: gap
   severity: medium
   description: "AC requires tests but no *.spec.ts or *.test.ts files found"
   suggestion: "Create test file: src/tickets/__tests__/CreateTicketUseCase.spec.ts"
   evidence: "$ find . -name '*.spec.ts'\n(no matches)"
   ```

2. **Verify test structure** (if AC mentions specific test patterns):
   ```bash
   grep -r "describe\|test\|it" src/**/*.spec.ts --include="*.spec.ts" | head -5
   ```
   ✅ Test framework patterns found → skip, no finding
   ❌ No patterns found → create finding
   
   Example finding:
   ```
   category: gap
   severity: low
   description: "Test files exist but no describe/test/it patterns found"
   suggestion: "Add Jest test structure: describe('ClassName', () => { it('should...', () => {}) })"
   evidence: "$ grep 'describe' src/**/*.spec.ts\n(no matches)"
   ```

3. **Verify test runner setup** (if AC mentions test execution):
   ```bash
   npm run test -- --listTests 2>&1 | head -5
   ```
   ✅ Test runner configured → skip, no finding
   ❌ Test runner not configured → create finding
   
   Alternative check:
   ```bash
   grep "\"test\":" package.json
   ```
   
   Example finding:
   ```
   category: gap
   severity: medium
   description: "AC requires running tests but 'test' script not found in package.json"
   suggestion: "Add test script: \"test\": \"jest\" to package.json scripts"
   evidence: "$ grep 'test' package.json\n(no matches)"
   codeLocation: "package.json"
   ```

**CRITICAL: DO NOT RUN THESE COMMANDS (too slow):**
- ❌ `npm test` - runs full test suite (minutes)
- ❌ `npm run test:coverage` - runs with coverage (minutes)
- ❌ `jest` - executes tests (slow)

**Only verify test setup exists, don't execute.**

**STOP after 3 checks or first blocker found.**

**Output Format:**

Return array of findings (empty if all checks pass):
```typescript
[
  {
    category: 'gap',
    severity: 'critical' | 'high' | 'medium' | 'low',
    description: string,
    codeLocation?: string,
    suggestion: string,
    confidence: 0.85,
    evidence?: string
  }
]
```

**References:**
- Jest Best Practices: https://jestjs.io/docs/getting-started
- Vitest Guide: https://vitest.dev/guide/
- Testing Library: https://testing-library.com/docs/
