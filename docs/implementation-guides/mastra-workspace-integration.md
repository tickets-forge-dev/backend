# Mastra Workspace Integration Guide

**Epic:** Epic 7 - Code-Aware Validation & Pre-Implementation Analysis
**Last Updated:** 2026-02-02
**Target Audience:** Backend engineers implementing Epic 7

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Workspace Architecture](#workspace-architecture)
5. [Implementation Steps](#implementation-steps)
6. [Skills Development](#skills-development)
7. [Agent Implementation](#agent-implementation)
8. [Testing Strategy](#testing-strategy)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks through integrating Mastra v1 Workspace into the forge validation system to enable code-aware analysis. By the end, validation will generate concrete findings from analyzing actual cloned repositories.

### What We're Building

```typescript
// Before: Abstract validation
{
  readinessScore: 65,
  validationResults: [
    { validator: 'Risk', score: 65, issues: ['High complexity detected'] }
  ]
}

// After: Concrete findings
{
  readinessScore: 65, // Still calculated
  preImplementationFindings: [
    {
      category: 'security',
      severity: 'critical',
      description: "Ticket requires 'improve security headers' but helmet package not installed",
      codeLocation: 'backend/src/main.ts',
      suggestion: "Add AC: 'GIVEN API running WHEN response sent THEN helmet headers included'",
      evidence: "npm list helmet → (empty)",
      confidence: 0.95
    }
  ]
}
```

---

## Prerequisites

### Dependencies

```bash
# Install Mastra workspace package
npm install @mastra/core

# Peer dependencies
npm install zod  # For schema validation
```

### Existing Systems Required

- Repository cloning (Epic 4 - Story 4.2): Repos must be cloned to disk
- Repository indexing (Epic 4 - Story 4.2): Must have `indexId` to map workspace
- AEC domain model (Epic 2 - Story 2.3): For storing findings

### Environment Setup

```bash
# Create workspace directory structure
mkdir -p backend/workspace/skills
mkdir -p backend/workspace/cloned-repos
mkdir -p backend/workspace/temp
```

---

## Installation

### 1. Update package.json

```json
{
  "dependencies": {
    "@mastra/core": "^1.0.0",
    "zod": "^3.23.0"
  }
}
```

### 2. Install and Verify

```bash
cd backend
npm install

# Verify installation
node -e "const { Workspace, LocalFilesystem, LocalSandbox } = require('@mastra/core/workspace'); console.log('✅ Mastra installed');"
```

---

## Workspace Architecture

### Directory Structure

```
backend/
├── workspace/                          # Mastra workspace root
│   ├── skills/                         # Analysis skills
│   │   ├── security-audit/
│   │   │   ├── SKILL.md                # Skill definition
│   │   │   └── references/
│   │   │       └── owasp-top-10.md
│   │   ├── architecture-validation/
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   │       └── clean-architecture.md
│   │   ├── dependency-audit/
│   │   │   ├── SKILL.md
│   │   │   └── scripts/
│   │   │       └── check-deps.sh
│   │   └── test-coverage/
│   │       └── SKILL.md
│   └── cloned-repos/                   # Cloned repositories
│       └── {workspaceId}-{repoName}/   # One directory per repo
│           └── (cloned code)
├── src/
│   └── validation/
│       ├── infrastructure/
│       │   ├── MastraWorkspaceFactory.ts
│       │   └── WorkspaceCache.ts
│       ├── agents/
│       │   ├── PreImplementationAgent.ts
│       │   ├── SecurityAnalysisAgent.ts
│       │   └── ArchitectureValidationAgent.ts
│       └── domain/
│           └── Finding.ts
```

---

## Implementation Steps

### Step 1: Create Workspace Factory (Story 7.1)

**File:** `backend/src/validation/infrastructure/MastraWorkspaceFactory.ts`

```typescript
import { Workspace, LocalFilesystem, LocalSandbox, WORKSPACE_TOOLS } from '@mastra/core/workspace';
import { z } from 'zod';
import path from 'path';

export class MastraWorkspaceFactory {
  private static workspaces = new Map<string, Workspace>();

  /**
   * Get or create workspace for a repository
   * @param workspaceId - User's workspace ID
   * @param repoName - Repository name (e.g., "user/repo")
   * @param indexId - Repository index ID from Epic 4
   */
  static async getWorkspace(
    workspaceId: string,
    repoName: string,
    indexId: string
  ): Promise<Workspace> {
    const cacheKey = `${workspaceId}-${repoName}`;

    // Return cached workspace if exists
    if (this.workspaces.has(cacheKey)) {
      return this.workspaces.get(cacheKey)!;
    }

    // Create new workspace
    const repoPath = path.join(
      process.cwd(),
      'workspace',
      'cloned-repos',
      cacheKey
    );

    const workspace = new Workspace({
      filesystem: new LocalFilesystem({
        basePath: repoPath,
        readOnly: true, // CRITICAL: Prevent agents from modifying code
      }),
      sandbox: new LocalSandbox({
        workingDirectory: repoPath,
        // Optional: isolate environment variables
        env: {
          NODE_ENV: 'analysis',
          PATH: process.env.PATH, // Keep PATH for npm, git, etc.
        },
      }),
      skills: ['/workspace/skills'], // Path relative to backend/
      tools: {
        // Global: all tools enabled except delete
        enabled: true,
        requireApproval: false,

        // Disable destructive operations
        [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: {
          enabled: false,
        },

        // Allow safe operations
        [WORKSPACE_TOOLS.FILESYSTEM.READ_FILE]: { enabled: true },
        [WORKSPACE_TOOLS.FILESYSTEM.LIST_DIRECTORY]: { enabled: true },
        [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: { enabled: true },
      },
    });

    // Initialize workspace (creates directories, indexes skills)
    await workspace.init();

    // Cache for reuse
    this.workspaces.set(cacheKey, workspace);

    return workspace;
  }

  /**
   * Clear workspace cache (call when repo updated)
   */
  static clearWorkspace(workspaceId: string, repoName: string): void {
    const cacheKey = `${workspaceId}-${repoName}`;
    this.workspaces.delete(cacheKey);
  }

  /**
   * Clear all workspaces (cleanup on shutdown)
   */
  static clearAll(): void {
    this.workspaces.clear();
  }
}
```

### Step 2: Define Finding Domain Model

**File:** `backend/src/validation/domain/Finding.ts`

```typescript
import { z } from 'zod';

export const FindingCategorySchema = z.enum([
  'gap',
  'conflict',
  'missing-dependency',
  'architectural-mismatch',
  'security',
]);

export const FindingSeveritySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
]);

export const FindingSchema = z.object({
  id: z.string(),
  category: FindingCategorySchema,
  severity: FindingSeveritySchema,
  description: z.string().min(10).max(500),
  codeLocation: z.string().optional(),
  suggestion: z.string().min(10),
  confidence: z.number().min(0).max(1),
  evidence: z.string().optional(),
  createdAt: z.date(),
});

export type FindingCategory = z.infer<typeof FindingCategorySchema>;
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;
export type Finding = z.infer<typeof FindingSchema>;

export class FindingFactory {
  static create(input: Omit<Finding, 'id' | 'createdAt'>): Finding {
    return {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };
  }
}
```

---

## Skills Development

### Skill 1: Security Audit

**File:** `backend/workspace/skills/security-audit/SKILL.md`

```markdown
---
name: security-audit
description: Audits codebase for security best practices
version: 1.0.0
tags: [security, validation, audit]
---

# Security Audit

You are a security auditor analyzing a ticket for security gaps in the codebase.

## Your Goal

Identify concrete security issues by comparing the ticket's requirements against the actual code.

## Steps

1. **Read the ticket** - Understand what security improvements are requested
2. **Check dependencies** - Verify security packages are installed
3. **Scan code patterns** - Look for auth, secrets, validation patterns
4. **Generate findings** - List concrete gaps with evidence

## Commands to Run

### Check for security packages
\`\`\`bash
npm list helmet cors express-rate-limit csurf express-validator
\`\`\`

### Search for auth patterns
\`\`\`bash
grep -r "passport\|jwt\|auth" --include="*.ts" --include="*.js" src/
\`\`\`

### Find hardcoded secrets (red flag)
\`\`\`bash
grep -r "password\|secret\|api.?key" --include="*.ts" --exclude="*.test.ts" src/
\`\`\`

### Check for input validation
\`\`\`bash
grep -r "express-validator\|joi\|zod" --include="*.ts" src/
\`\`\`

## What to Look For

### Missing Packages
If ticket mentions "security" or "headers" but helmet not installed → CRITICAL finding

### Hardcoded Credentials
If grep finds "password" or "secret" in code (not env vars) → HIGH finding

### Missing Validation
If ticket affects user input endpoints but no validation library → MEDIUM finding

### Missing Auth Middleware
If ticket changes routes but no auth middleware detected → HIGH finding

## Output Format

For each issue found, create a finding:

\`\`\`json
{
  "category": "security",
  "severity": "critical",
  "description": "Ticket requires security headers but helmet package not installed",
  "codeLocation": "backend/src/main.ts",
  "suggestion": "Add acceptance criteria: 'GIVEN API running WHEN response sent THEN helmet headers (X-Frame-Options, CSP) included'. Install: npm install helmet. Add: app.use(helmet())",
  "evidence": "$ npm list helmet\\n└── (empty)",
  "confidence": 0.95
}
\`\`\`

## References

- [OWASP Top 10](./references/owasp-top-10.md)
- [Helmet.js Documentation](https://helmetjs.github.io/)
```

**File:** `backend/workspace/skills/security-audit/references/owasp-top-10.md`

```markdown
# OWASP Top 10 (2021)

1. **Broken Access Control** - Missing auth checks
2. **Cryptographic Failures** - Weak encryption, hardcoded secrets
3. **Injection** - SQL, NoSQL, Command injection
4. **Insecure Design** - Missing security controls
5. **Security Misconfiguration** - Default configs, missing headers
6. **Vulnerable Components** - Outdated dependencies
7. **Identification and Authentication Failures** - Weak passwords, no MFA
8. **Software and Data Integrity Failures** - Unsigned packages
9. **Security Logging Failures** - No audit logs
10. **Server-Side Request Forgery (SSRF)** - Unvalidated URLs

(Full details at https://owasp.org/Top10/)
```

### Skill 2: Architecture Validation

**File:** `backend/workspace/skills/architecture-validation/SKILL.md`

```markdown
---
name: architecture-validation
description: Validates ticket assumptions against actual architecture
version: 1.0.0
tags: [architecture, clean-architecture, validation]
---

# Architecture Validation

You validate that the ticket's architectural assumptions match the actual codebase structure.

## Your Goal

Catch architectural mismatches before implementation to prevent code in wrong layers.

## Steps

1. **Detect architecture pattern** - Clean Architecture, MVC, Hexagonal, etc.
2. **Check ticket assumptions** - Where does ticket say to put code?
3. **Verify folder structure** - Does the assumed location exist?
4. **Validate layer boundaries** - Is the ticket respecting boundaries?

## Commands to Run

### Detect Clean Architecture
\`\`\`bash
find . -type d -name "domain" -o -name "application" -o -name "infrastructure" -o -name "presentation"
\`\`\`

### Find controllers (presentation layer)
\`\`\`bash
grep -r "@Controller\|@Get\|@Post" --include="*.ts" src/
\`\`\`

### Find use cases (application layer)
\`\`\`bash
find . -name "*UseCase.ts" -o -name "*use-case.ts"
\`\`\`

### Find domain entities
\`\`\`bash
find . -path "*/domain/*.ts" ! -path "*/node_modules/*"
\`\`\`

### Check for NestJS (if detected)
\`\`\`bash
grep -r "@Injectable\|@Module" --include="*.ts" src/
\`\`\`

## What to Look For

### Business Logic in Wrong Layer
If ticket puts business logic in controller → Finding: should be in use case

### Missing Domain Entity
If ticket references entity that doesn't exist → Finding: create entity first or update ticket

### Repository Direct Access
If controller calls repository directly → Finding: violates Clean Architecture

### Wrong API Pattern
If ticket assumes REST but GraphQL decorators found → Finding: mismatch

## Output Format

\`\`\`json
{
  "category": "architectural-mismatch",
  "severity": "high",
  "description": "Ticket places validation logic in presentation layer (controller)",
  "codeLocation": "Acceptance criteria line 3",
  "suggestion": "Move validation to use case. Update AC: 'WHEN use case validates input THEN...'",
  "evidence": "$ find . -name '*UseCase.ts'\\nsrc/tickets/application/use-cases/CreateTicketUseCase.ts",
  "confidence": 0.85
}
\`\`\`
```

---

## Agent Implementation

### PreImplementationAgent (Story 7.3)

**File:** `backend/src/validation/agents/PreImplementationAgent.ts`

```typescript
import { Agent } from '@mastra/core/agent';
import { Workspace } from '@mastra/core/workspace';
import { AEC } from '../../tickets/domain/AEC';
import { Finding, FindingFactory } from '../domain/Finding';
import { z } from 'zod';

const FindingsOutputSchema = z.object({
  findings: z.array(z.object({
    category: z.enum(['gap', 'conflict', 'missing-dependency', 'architectural-mismatch']),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    description: z.string(),
    codeLocation: z.string().optional(),
    suggestion: z.string(),
    confidence: z.number(),
    evidence: z.string().optional(),
  })),
});

export class PreImplementationAgent {
  private agent: Agent;

  constructor(private workspace: Workspace) {
    this.agent = new Agent({
      id: 'pre-implementation-simulator',
      model: 'openai/gpt-4o', // Or 'anthropic/claude-sonnet-4.5'
      instructions: `
You are a pre-implementation analysis agent. Your job is to simulate ticket implementation
and identify gaps, conflicts, and issues by exploring the actual codebase.

## Your Process

1. Read the AEC (ticket) carefully - especially acceptance criteria and repo paths
2. Use workspace tools to explore the codebase:
   - Check if referenced files/modules exist
   - Verify dependencies are installed
   - Find existing code patterns
3. Simulate implementation mentally (DO NOT generate code)
4. Identify concrete issues with evidence
5. Generate findings with actionable suggestions

## Critical Rules

- ALWAYS provide evidence (command output, file paths)
- Be specific: "file.ts:42" not "somewhere in the code"
- Suggest exact acceptance criteria to add
- Only report issues you can verify (confidence > 0.7)
- Activate relevant skills (security, architecture, etc.)

## Output Format

Return JSON array of findings. Each finding must have:
- category, severity, description, suggestion
- codeLocation (if applicable)
- evidence (command output proving the issue)
- confidence (0-1)
      `,
      workspace: this.workspace,
    });
  }

  async analyze(aec: AEC): Promise<Finding[]> {
    const prompt = `
Analyze this ticket for implementation gaps:

**Ticket Title:** ${aec.title}
**Description:** ${aec.description || 'None'}
**Repo Paths:** ${aec.repoPaths.join(', ')}
**Acceptance Criteria:**
${aec.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

**Instructions:**
1. Check if repo paths exist
2. Verify dependencies mentioned in AC are installed
3. Look for architectural mismatches
4. Activate security-audit skill if ticket mentions security
5. Activate architecture-validation skill

Generate findings with evidence.
    `;

    const result = await this.agent.generate(prompt, {
      schema: FindingsOutputSchema,
    });

    // Parse findings
    const parsed = FindingsOutputSchema.parse(result.data);

    return parsed.findings.map(f => FindingFactory.create(f));
  }
}
```

---

## Testing Strategy

### Unit Tests

**File:** `backend/src/validation/agents/__tests__/PreImplementationAgent.test.ts`

```typescript
import { PreImplementationAgent } from '../PreImplementationAgent';
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace';
import { AECFactory } from '../../../tickets/domain/AEC';
import path from 'path';

describe('PreImplementationAgent', () => {
  let workspace: Workspace;
  let agent: PreImplementationAgent;

  beforeAll(async () => {
    // Create test workspace with mock repository
    workspace = new Workspace({
      filesystem: new LocalFilesystem({
        basePath: path.join(__dirname, 'fixtures', 'mock-repo'),
        readOnly: true,
      }),
      sandbox: new LocalSandbox({
        workingDirectory: path.join(__dirname, 'fixtures', 'mock-repo'),
      }),
      skills: ['/workspace/skills'],
    });

    await workspace.init();
    agent = new PreImplementationAgent(workspace);
  });

  it('should detect missing dependency', async () => {
    const aec = AECFactory.create({
      title: 'Add security headers',
      description: 'Improve API security with helmet',
      acceptanceCriteria: [
        'GIVEN API is running WHEN response sent THEN helmet headers included',
      ],
      repoPaths: ['src/main.ts'],
    });

    const findings = await agent.analyze(aec);

    expect(findings).toHaveLength(1);
    expect(findings[0].category).toBe('missing-dependency');
    expect(findings[0].description).toContain('helmet');
    expect(findings[0].evidence).toContain('npm list');
  });

  it('should detect missing file', async () => {
    const aec = AECFactory.create({
      title: 'Update user profile',
      description: 'Allow users to edit profile',
      acceptanceCriteria: ['Update user domain entity'],
      repoPaths: ['src/domain/user/User.ts'], // Doesn't exist in fixture
    });

    const findings = await agent.analyze(aec);

    expect(findings.some(f => f.category === 'gap')).toBe(true);
    expect(findings.some(f => f.codeLocation?.includes('User.ts'))).toBe(true);
  });
});
```

### Integration Tests

Test with real cloned repository (forge itself):

```typescript
describe('PreImplementationAgent - Integration', () => {
  it('should analyze real forge repository', async () => {
    const workspace = await MastraWorkspaceFactory.getWorkspace(
      'test-workspace',
      'forge',
      'test-index-id'
    );

    const agent = new PreImplementationAgent(workspace);
    const aec = {
      title: 'Add validation engine',
      acceptanceCriteria: ['Validate tickets with multi-criteria scoring'],
      repoPaths: ['backend/src/validation/'],
    };

    const findings = await agent.analyze(aec);

    // Should return findings or empty array (both valid)
    expect(Array.isArray(findings)).toBe(true);
  });
});
```

---

## Security Considerations

### 1. Command Injection Prevention

```typescript
// BAD: User input directly in command
const command = `grep "${aec.title}" src/`; // VULNERABLE

// GOOD: Sanitize or avoid user input in commands
const command = `grep -r "helmet" --include="*.ts" src/`;
```

### 2. Read-Only Filesystem

```typescript
// Workspace configuration MUST have readOnly: true
filesystem: new LocalFilesystem({
  basePath: repoPath,
  readOnly: true, // Prevents write_file, delete operations
})
```

### 3. Sandbox Isolation

```typescript
// Sandbox should only access cloned repo directory
sandbox: new LocalSandbox({
  workingDirectory: repoPath, // Limited to this directory
  env: {
    // Minimal environment variables
    NODE_ENV: 'analysis',
    PATH: process.env.PATH,
    // DO NOT expose: DATABASE_URL, API_KEYS, etc.
  },
})
```

### 4. Command Whitelist

```typescript
// Allowed safe commands
const SAFE_COMMANDS = [
  'npm list',
  'npm view',
  'grep',
  'find',
  'ls',
  'cat',
  'git log',
  'git branch',
];

// Reject dangerous commands
const DANGEROUS_COMMANDS = [
  'rm',
  'mv',
  'chmod',
  'curl',
  'wget',
  'npm install', // Could modify package.json
];
```

---

## Performance Optimization

### 1. Workspace Caching

```typescript
// Cache workspace per repository (reuse across tickets)
static workspaces = new Map<string, Workspace>();

// Clear cache when repository updated
static clearWorkspace(workspaceId: string, repoName: string): void {
  const cacheKey = `${workspaceId}-${repoName}`;
  this.workspaces.delete(cacheKey);
}
```

### 2. Parallel Agent Execution

```typescript
// Run agents in parallel (not sequential)
const [securityFindings, architectureFindings, generalFindings] = await Promise.all([
  securityAgent.analyze(aec),
  architectureAgent.analyze(aec),
  preImplementationAgent.analyze(aec),
]);

const allFindings = [
  ...securityFindings,
  ...architectureFindings,
  ...generalFindings,
];
```

### 3. Lazy Loading

```typescript
// Only create workspace when ticket affects indexed repo
if (aec.codeSnapshot && aec.codeSnapshot.indexId) {
  const workspace = await MastraWorkspaceFactory.getWorkspace(...);
  const findings = await agent.analyze(aec);
} else {
  // Skip code analysis for tickets without repo context
  const findings = [];
}
```

### 4. Command Output Limits

```typescript
// Limit command output to prevent memory issues
sandbox: new LocalSandbox({
  workingDirectory: repoPath,
  timeout: 10000, // 10 second timeout per command
  maxOutputLength: 10000, // 10KB max output
})
```

---

## Troubleshooting

### Issue: Workspace init() fails

**Error:** `ENOENT: no such file or directory`

**Solution:**
```bash
# Ensure cloned-repos directory exists
mkdir -p backend/workspace/cloned-repos

# Verify repository was cloned (Epic 4)
ls backend/workspace/cloned-repos/{workspaceId}-{repoName}
```

### Issue: Agent returns no findings

**Causes:**
1. Workspace not configured with skills
2. Agent prompt not activating skills
3. LLM hallucinating instead of using tools

**Debug:**
```typescript
// Enable debug logging
const agent = new Agent({
  id: 'test-agent',
  model: 'openai/gpt-4o',
  workspace,
  debug: true, // Logs tool calls
});

// Check if skills loaded
console.log('Skills:', workspace.skills);
```

### Issue: "Command not found" errors

**Cause:** Sandbox environment missing PATH or binaries

**Solution:**
```typescript
sandbox: new LocalSandbox({
  workingDirectory: repoPath,
  env: {
    PATH: process.env.PATH, // Include system PATH
  },
})
```

### Issue: High LLM token usage

**Mitigation:**
- Use structured output (schema) to reduce verbosity
- Limit command output length
- Cache findings for similar tickets
- Use cheaper model (gpt-4o-mini) for non-critical agents

---

## Next Steps

1. **Implement Story 7.1:** MastraWorkspaceFactory
2. **Implement Story 7.2:** Create 4 core skills
3. **Implement Story 7.3:** PreImplementationAgent
4. **Add unit tests** for each component
5. **Integration test** with forge repository
6. **Performance benchmark** - target <30s analysis time

---

## Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [Agent Skills Spec](https://agentskills.io)
- [ADR-007: Mastra Workspace for Validation](../architecture/ADR-007-mastra-workspace-validation.md)
- [Epic 7 Details](../epics.md#epic-7)

---

**Questions?** Reach out to the forge team or consult the Mastra community Discord.
