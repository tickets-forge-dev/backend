# Story 7.2: Quick Check Skills - Fast, Targeted Validation Patterns

**Epic:** Epic 7 - Code-Aware Validation & Pre-Implementation Analysis  
**Story ID:** 7.2  
**Created:** 2026-02-03  
**Status:** Done  
**Priority:** P0  
**Effort Estimate:** 4-6 hours

---

## User Story

As a validation engineer,  
I want reusable skills with FAST, efficient commands,  
So that agents can validate critical assumptions in seconds (not minutes).

---

## Acceptance Criteria

**Given** the Mastra workspace is configured  
**When** this story is complete  
**Then** the following skills exist in `backend/workspace/skills/`:

### Skill 1: Security Quick Check

**File:** `backend/workspace/skills/security-quick-check/SKILL.md`

**FAST commands only** (1-3 seconds each):
- `npm list helmet cors express-rate-limit` - Check security packages
- `grep -r "process.env" --include="*.ts"` - Find hardcoded env vars
- `grep -r "password\|secret\|api.?key" --include="*.ts"` - Find secrets

**No deep analysis** - just verify presence/absence  
**Targeted only** - skip if ticket not security-related  
**References:** OWASP Top 10 checklist

### Skill 2: Architecture Quick Check

**File:** `backend/workspace/skills/architecture-quick-check/SKILL.md`

**FAST commands only** (1-3 seconds each):
- `find src -type d -name "domain"` - Verify layer structure
- `grep -r "import.*infrastructure" src/domain/` - Check boundary violations
- `find . -name "*.module.ts"` - Verify module structure

**Pattern matching only** - no deep exploration  
**Targeted only** - skip if ticket not architecture-related  
**References:** Clean Architecture, DDD patterns

### Skill 3: Dependency Quick Check

**File:** `backend/workspace/skills/dependency-quick-check/SKILL.md`

**FAST commands only** (1-3 seconds each):
- `npm list <package-name>` - Verify specific package exists
- `npm outdated --json` - Check outdated packages (if needed)
- `grep -r "from '@/" package.json` - Check workspace imports

**One package at a time** - validate what ticket needs only  
**Targeted only** - skip if dependencies not mentioned in AC  
**Scripts:** `scripts/check-deps.sh` (optional wrapper)

### Skill 4: Test Pattern Quick Check

**File:** `backend/workspace/skills/test-pattern-quick-check/SKILL.md`

**FAST commands only** (1-3 seconds each):
- `find . -name "*.spec.ts" -o -name "*.test.ts"` - Find test files
- `grep -r "describe\|test\|it" src/**/*.spec.ts` - Verify test structure
- `npm run test -- --listTests` - Verify test runner setup

**Pattern verification only** - don't run tests  
**Targeted only** - skip if AC don't mention tests  
**References:** Jest/Vitest conventions

---

**And** each skill follows [agentskills.io spec](https://agentskills.io) with:
- Frontmatter: `name`, `description`, `version`, `tags`, `performance`
- Performance constraints section (maximum 3 commands, 1-3 seconds each)
- Activation criteria (when to use this skill)
- Quick checks with command examples
- Decision logic (✅ skip if found, ❌ create finding if missing)

---

**And** skills are discoverable:
- Agent receives list of available skills
- Agent activates relevant skills based on ticket content
- Skill instructions added to agent context

---

## Prerequisites

- ✅ Story 7.1: Mastra Workspace Configuration (COMPLETED)
- Mastra workspace configured with LocalFilesystem and LocalSandbox
- Repository cloned and accessible

---

## Tasks and Subtasks

### Task 1: Create Skills Directory Structure
**Layer:** Infrastructure (Workspace)

**1.1** Create skills directory structure
- Path: `backend/workspace/skills/`
- Create subdirectories:
  - `security-quick-check/`
  - `architecture-quick-check/`
  - `dependency-quick-check/`
  - `test-pattern-quick-check/`

**1.2** Add skills to .gitignore exception
- Ensure skills directory is committed to version control
- Skills are reusable across projects

**Testing:**
- [x] Verify directory structure created
- [x] Verify skills committed to git

---

### Task 2: Implement Security Quick Check Skill
**Layer:** Infrastructure (Validation Skills)

**2.1** Create SKILL.md for security-quick-check
- File: `backend/workspace/skills/security-quick-check/SKILL.md`
- Follow agentskills.io specification format
- Include frontmatter with metadata

**2.2** Define performance constraints
- Maximum 3 commands per validation
- Each command must complete in 1-3 seconds
- Only check assumptions mentioned in ticket AC
- Skip if ticket has no security-related AC

**2.3** Define activation criteria
- Keywords: "security", "auth", "helmet", "cors", "secrets"
- AC patterns: security headers, authentication, authorization

**2.4** Document quick checks with commands
- **Check 1:** Missing security packages
  - Command: `npm list helmet cors express-rate-limit`
  - Decision: Package exists → skip | Package missing → finding
  
- **Check 2:** Hardcoded secrets
  - Command: `grep -r "process.env" --include="*.ts" src/`
  - Decision: Uses env vars → skip | Hardcoded found → finding
  
- **Check 3:** Auth patterns
  - Command: `grep -r "passport\|jwt\|auth" src/main.ts src/app.module.ts`
  - Decision: Auth setup found → skip | No auth found → finding

**2.5** Add stopping criteria
- Stop after 3 checks OR first blocker found
- Document in skill: "STOP after 3 checks or first blocker found."

**Testing:**
- [x] Skill follows agentskills.io spec
- [x] All commands complete in <3 seconds
- [x] Activation criteria are clear

---

### Task 3: Implement Architecture Quick Check Skill
**Layer:** Infrastructure (Validation Skills)

**3.1** Create SKILL.md for architecture-quick-check
- File: `backend/workspace/skills/architecture-quick-check/SKILL.md`
- Follow agentskills.io specification format

**3.2** Define activation criteria
- Keywords: "layer", "module", "clean architecture", "DDD", "boundary"
- AC patterns: mentions specific layers, architecture patterns

**3.3** Document quick checks
- **Check 1:** Verify layer structure
  - Command: `find src -type d -name "domain"`
  - Decision: Domain layer exists → skip | Missing → finding
  
- **Check 2:** Check boundary violations
  - Command: `grep -r "import.*infrastructure" src/domain/`
  - Decision: No imports → skip | Imports found → finding
  
- **Check 3:** Verify module structure
  - Command: `find . -name "*.module.ts"`
  - Decision: Modules found → skip | Missing → finding

**Testing:**
- [x] Commands are fast (1-3 seconds)
- [x] Pattern matching only (no deep exploration)
- [x] References Clean Architecture docs

---

### Task 4: Implement Dependency Quick Check Skill
**Layer:** Infrastructure (Validation Skills)

**4.1** Create SKILL.md for dependency-quick-check
- File: `backend/workspace/skills/dependency-quick-check/SKILL.md`

**4.2** Define activation criteria
- AC mentions specific packages or dependencies
- Keywords: "install", "package", "dependency", "npm", "pnpm"

**4.3** Document quick checks
- **Check 1:** Verify specific package exists
  - Command: `npm list <package-name>`
  - Dynamic: Replace `<package-name>` with AC-mentioned package
  - Decision: Package installed → skip | Missing → finding with install command
  
- **Check 2:** Check outdated packages (optional)
  - Command: `npm outdated --json`
  - Only if AC mentions "update" or "upgrade"
  
- **Check 3:** Workspace imports
  - Command: `grep -r "from '@/" package.json`
  - Verify workspace imports configured

**4.4** Create optional wrapper script
- File: `scripts/check-deps.sh` (optional)
- Wraps npm list with cleaner output

**Testing:**
- [x] One package at a time (not all packages)
- [x] Skip if dependencies not mentioned in AC
- [x] Install suggestions in findings

---

### Task 5: Implement Test Pattern Quick Check Skill
**Layer:** Infrastructure (Validation Skills)

**5.1** Create SKILL.md for test-pattern-quick-check
- File: `backend/workspace/skills/test-pattern-quick-check/SKILL.md`

**5.2** Define activation criteria
- AC mentions: "test", "testing", "unit test", "integration test"
- Keywords: "Jest", "Vitest", "spec", "test coverage"

**5.3** Document quick checks
- **Check 1:** Find test files
  - Command: `find . -name "*.spec.ts" -o -name "*.test.ts"`
  - Decision: Tests exist → skip | No tests → finding
  
- **Check 2:** Verify test structure
  - Command: `grep -r "describe\|test\|it" src/**/*.spec.ts`
  - Decision: Test framework used → skip | No patterns → finding
  
- **Check 3:** Verify test runner setup
  - Command: `npm run test -- --listTests`
  - Decision: Runner configured → skip | Error → finding

**5.4** Add guidance on test conventions
- Reference Jest/Vitest conventions
- Don't run tests (too slow) - just verify setup

**Testing:**
- [x] Pattern verification only
- [x] Don't run full test suites
- [x] Targeted to AC mentions only

---

### Task 6: Skill Discovery and Documentation

**6.1** Document skill directory structure
- Create `backend/workspace/skills/README.md`
- Explain agentskills.io format
- List all available skills
- Performance guidelines

**6.2** Add skills to Mastra workspace configuration
- Update `MastraWorkspaceFactory.ts` to include skills path
- Configure skills directory: `skills: ['./workspace/skills']`

**6.3** Implement skill listing for agents
- Create `listAvailableSkills()` method
- Returns skill names and descriptions
- Used by validation agents to select relevant skills

**Testing:**
- [x] Skills discoverable by workspace
- [x] Agents can list available skills
- [x] Skills auto-indexed if search enabled

---

## Dev Notes

### Architecture Context

**Skill Storage:**
- Path: `backend/workspace/skills/`
- One directory per skill
- Each skill has `SKILL.md` following agentskills.io spec
- Skills are reusable across repositories

**Skill Format (agentskills.io spec):**
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
   ✅ Success case → skip
   ❌ Failure case → create finding

**STOP conditions**
```

**Integration with Mastra:**
- Mastra workspace auto-discovers skills in configured directory
- Agent receives skill instructions when activated
- Skills provide context for validation decisions

### Performance Requirements (CRITICAL)

**All skills MUST be FAST:**
- ⏱️ Each command: 1-3 seconds max
- 🔧 Max 3 commands per skill activation
- 🎯 Targeted checks only (not comprehensive audits)
- ⚡ Skip if ticket doesn't mention relevant topic

**Performance Guidance:**
- ✅ **GOOD:** `npm list helmet`, `grep -r "pattern" src/`, `find . -name "*.spec.ts"`
- ❌ **BAD:** Reading 20 files, running test suites, complex analysis
- 📏 **Rule of thumb:** If a command takes >3 seconds, it's too slow for preflight

### Learnings from Previous Story

**From Story 7.1: Mastra Workspace Configuration (Status: done)**

**Implementation Completed:**
- `MastraWorkspaceFactory.ts` - Creates workspace per repository
- `LocalFilesystem` with `basePath` to cloned repo
- `LocalSandbox` with `workingDirectory` set to repo root
- Tool safety configuration (read-only, no delete)
- Workspace lifecycle (init, reuse, cleanup)

**Key Patterns Established:**
- Workspace instances cached in memory per repository
- Repository `indexId` maps to workspace
- Read-only mode for safety (agents can't modify code)
- Workspace persists across multiple validations

**Technical Context:**
- Path: `backend/src/validation/infrastructure/MastraWorkspaceFactory.ts`
- Integrates with `RepoIndexer` service from Epic 4
- Skills directory configuration: `skills: ['/workspace/skills']`

**Reusable for This Story:**
- Skills path already configured in workspace factory
- Just need to create skill files in configured directory
- Workspace will auto-discover skills on init

[Source: Story 7.1 implementation notes]

---

## Change Log

| Date       | Author | Change Description |
|------------|--------|--------------------|
| 2026-02-03 | BMad   | Initial story creation from Epic 7.2 requirements |
| 2026-02-03 | Amelia | Implementation complete - All 4 skills created with agentskills.io spec compliance |

---

## Functional Requirements Coverage

**FR5 (Enhanced):** System validates tickets against structural, behavioral, testability, risk, permission criteria with concrete code-aware findings ✅

---

## Dev Agent Record

### Completion Notes
- [x] All 4 skills created following agentskills.io spec
- [x] Each skill has performance constraints documented
- [x] All commands tested and complete in <3 seconds
- [x] Skills discoverable by Mastra workspace
- [x] README.md created with skill documentation

**Skills Created:**
1. Security Quick Check - 3 commands: npm list, grep secrets, grep auth
2. Architecture Quick Check - 3 commands: find layers, grep imports, find modules  
3. Dependency Quick Check - 3 commands: npm list, npm outdated, grep workspace
4. Test Pattern Quick Check - 3 commands: find tests, grep patterns, verify runner

**Integration:**
- MastraWorkspaceFactory updated with skills path: `./workspace/skills`
- Added `listAvailableSkills()` method for agent discovery
- Skills auto-discovered by Mastra workspace on init
- Each skill follows agentskills.io format with frontmatter

**Performance Verified:**
- All commands complete in 1-3 seconds
- Max 3 commands per skill
- Targeted checks only (no comprehensive audits)
- Skip logic if ticket doesn't mention relevant topic

### Context Reference
- `docs/sprint-artifacts/7-2-quick-check-skills-fast-targeted-validation-patterns.context.xml` - Generated 2026-02-03

### File List
**NEW:**
- `backend/workspace/skills/README.md` - Skills overview and documentation
- `backend/workspace/skills/security-quick-check/SKILL.md` - Security validation skill
- `backend/workspace/skills/architecture-quick-check/SKILL.md` - Architecture validation skill
- `backend/workspace/skills/dependency-quick-check/SKILL.md` - Dependency validation skill
- `backend/workspace/skills/test-pattern-quick-check/SKILL.md` - Test pattern validation skill

**MODIFIED:**
- `backend/src/validation/infrastructure/MastraWorkspaceFactory.ts` - Added listAvailableSkills() method, updated skills path comment

---

## Senior Developer Review (AI)
- [To be completed after implementation by code-review workflow]
