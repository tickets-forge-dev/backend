# Workspace Skills

This directory contains reusable validation skills following the [agentskills.io](https://agentskills.io) specification.

## Overview

Skills are FAST, targeted validation patterns used by the Quick Preflight Validator to check critical ticket assumptions in seconds (not minutes).

**Performance Constraints:**
- ⏱️ Each command: 1-3 seconds max
- 🔧 Max 3 commands per skill activation
- 🎯 Targeted checks only (not comprehensive audits)
- ⚡ Skip if ticket doesn't mention relevant topic

## Available Skills

### 1. Security Quick Check
**File:** `security-quick-check/SKILL.md`

**When to use:**
- Ticket mentions: security, auth, helmet, CORS, secrets
- AC include: security headers, authentication, authorization

**Quick checks:**
- Missing security packages (npm list)
- Hardcoded secrets (grep)
- Auth patterns (grep)

### 2. Architecture Quick Check
**File:** `architecture-quick-check/SKILL.md`

**When to use:**
- Ticket mentions: layer, module, Clean Architecture, DDD, boundary
- AC specify: architectural patterns, layer structure

**Quick checks:**
- Layer structure (find domain/application/infrastructure)
- Boundary violations (grep imports)
- Module structure (find *.module.ts)

### 3. Dependency Quick Check
**File:** `dependency-quick-check/SKILL.md`

**When to use:**
- AC mentions specific packages or dependencies
- Keywords: install, package, dependency, npm, pnpm

**Quick checks:**
- Specific package verification (npm list)
- Outdated packages (npm outdated)
- Workspace imports (grep tsconfig)

### 4. Test Pattern Quick Check
**File:** `test-pattern-quick-check/SKILL.md`

**When to use:**
- AC mentions: test, testing, unit test, integration test
- Keywords: Jest, Vitest, spec, describe, it

**Quick checks:**
- Find test files (find *.spec.ts)
- Verify test structure (grep describe/it)
- Verify test runner setup (grep package.json)

**CRITICAL:** Does NOT run tests (too slow)

## Skill Format (agentskills.io)

Each skill follows this structure:

```markdown
---
name: skill-name
description: Brief description
version: 1.0.0
tags: [category, validation, quick-check]
performance: fast-only
---

# Skill Title

**CRITICAL:** Performance constraints

**Performance Constraints:**
- Maximum N commands per validation
- Each command must complete in X seconds
- Only check Y mentioned in ticket AC

**When to activate:**
- Keyword patterns
- AC patterns

**Quick checks to run:**

1. **Check Name:**
   ```bash
   command example
   ```
   ✅ Success case → skip, no finding
   ❌ Failure case → create finding

**STOP conditions**
```

## Integration with Mastra Workspace

Skills are auto-discovered by Mastra workspace configured in `MastraWorkspaceFactory.ts`:

```typescript
const workspace = new Workspace({
  filesystem: new LocalFilesystem({
    basePath: './cloned-repos/...',
  }),
  sandbox: new LocalSandbox({
    workingDirectory: './cloned-repos/...',
  }),
  skills: ['./workspace/skills'], // ← Skills auto-discovered here
});
```

## Performance Guidance

**✅ GOOD Commands (1-3 seconds):**
- `npm list helmet`
- `grep -r "pattern" src/`
- `find . -name "*.spec.ts"`
- `tsc --noEmit src/file.ts`

**❌ BAD Commands (too slow for preflight):**
- Reading 20+ files
- Running full test suites (`npm test`)
- Complex analysis or compilation
- Deep directory traversal

**📏 Rule of Thumb:** If a command takes >3 seconds, it's too slow for preflight validation.

## Usage by Agents

The Quick Preflight Validator (Story 7.3) uses these skills:

1. **Skill Discovery:** Agent discovers available skills from workspace
2. **Skill Selection:** Matches ticket keywords to skill activation criteria
3. **Skill Loading:** Loads SKILL.md content into agent context
4. **Execution:** Agent runs commands from selected skills
5. **Finding Generation:** Agent creates Finding objects from command results

## Adding New Skills

To add a new skill:

1. Create directory: `backend/workspace/skills/my-skill/`
2. Create `SKILL.md` following agentskills.io format
3. Include frontmatter with metadata
4. Document performance constraints
5. Define activation criteria
6. Provide 1-3 fast command examples
7. Include decision logic (✅/❌)
8. Skills are auto-discovered on next workspace init

## Version

Current version: 1.0.0  
Last updated: 2026-02-03  
Epic: 7 - Code-Aware Validation
