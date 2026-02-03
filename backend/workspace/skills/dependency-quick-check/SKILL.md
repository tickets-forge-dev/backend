---
name: dependency-quick-check
description: Fast dependency verification for package installation
version: 1.0.0
tags: [dependency, validation, quick-check, npm, packages]
performance: fast-only
---

# Dependency Quick Check

**CRITICAL: This is a FAST validator for specific package checks, not a full dependency audit.**

**Performance Constraints:**
- Maximum 3 commands per validation
- Each command must complete in 1-3 seconds
- One package at a time - validate what ticket needs only
- Skip if dependencies not mentioned in AC

**When to activate:**
- Ticket AC mentions specific packages or dependencies
- Keywords: "install", "package", "dependency", "npm", "pnpm", "yarn"
- Ticket type: Feature requiring new npm packages

**Quick checks to run:**

1. **Verify specific package** (if AC mentions package name):
   ```bash
   npm list <package-name>
   ```
   Replace `<package-name>` with AC-mentioned package (e.g., `helmet`, `zod`, `@mastra/core`)
   
   ✅ Package installed → skip, no finding
   ❌ Package missing → create finding with install command
   
   Example finding:
   ```
   category: missing-dependency
   severity: high
   description: "helmet package required by AC but not installed"
   suggestion: "Install package: pnpm add helmet"
   evidence: "$ npm list helmet\n└── (empty)"
   confidence: 0.95
   ```

2. **Check outdated packages** (only if AC mentions "update" or "upgrade"):
   ```bash
   npm outdated --json
   ```
   ✅ All packages current → skip, no finding
   ❌ Critical package outdated → create finding
   
   Example finding:
   ```
   category: gap
   severity: medium
   description: "@nestjs/core is outdated (9.0.0 current, 10.0.0 available)"
   suggestion: "Update package: pnpm update @nestjs/core"
   evidence: "npm outdated output shows major version behind"
   ```

3. **Workspace imports** (if AC mentions monorepo/workspace packages):
   ```bash
   grep -r "from '@/\|from '@repo/" package.json tsconfig.json
   ```
   ✅ Workspace imports configured → skip, no finding
   ❌ Configuration missing → create finding
   
   Example finding:
   ```
   category: gap
   severity: low
   description: "Workspace imports (@/) not configured in tsconfig.json"
   suggestion: "Add paths to tsconfig.json: '@/*': ['src/*']"
   evidence: "$ grep '@/' tsconfig.json\n(no matches)"
   codeLocation: "tsconfig.json"
   ```

**Alternative check for package.json existence:**
```bash
test -f package.json && echo "exists" || echo "missing"
```

**STOP after 3 checks or first blocker found.**

**Output Format:**

Return array of findings (empty if all checks pass):
```typescript
[
  {
    category: 'missing-dependency' | 'gap',
    severity: 'critical' | 'high' | 'medium' | 'low',
    description: string,
    suggestion: string,
    confidence: 0.95,
    evidence?: string
  }
]
```

**Optional Wrapper Script:**

Create `scripts/check-deps.sh` for cleaner output:
```bash
#!/bin/bash
# Quick dependency checker
PACKAGE=$1
if npm list "$PACKAGE" >/dev/null 2>&1; then
  echo "✓ $PACKAGE installed"
  exit 0
else
  echo "✗ $PACKAGE missing"
  exit 1
fi
```

**References:**
- npm CLI: https://docs.npmjs.com/cli/v9/commands/npm-list
- pnpm Workspaces: https://pnpm.io/workspaces
- TypeScript Paths: https://www.typescriptlang.org/tsconfig#paths
