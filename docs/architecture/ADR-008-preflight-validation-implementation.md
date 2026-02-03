# ADR-008: Preflight Validation Implementation Strategy

**Status:** Accepted  
**Date:** 2026-02-03  
**Epic:** Epic 7 - Code-Aware Validation  
**Story:** 7.3 - Quick Preflight Validator

---

## Context

We need fast, targeted validation of tickets BEFORE implementation to catch blockers early. The challenge is balancing speed (10-30 seconds) with accuracy while working with GitHub repositories that can be large.

### Key Constraints

- **Time:** 10-30 seconds per validation
- **Tokens:** 2k-5k per validation  
- **Tool calls:** 3-7 maximum
- **Cost:** $0.01-0.05 per ticket
- **Memory:** Must handle large repositories without OOM errors

---

## Decision

### 1. GitHub Repository Access (NOT Local Clones)

**Decision:** Use GitHub API + Repository Index instead of local filesystem clones.

**Rationale:**
- Repository is on GitHub, not local filesystem
- Cloning large repos causes memory issues (see: heap out of memory errors)
- Repository Index (Story 4.2) already provides file metadata
- Validation needs file content selectively, not full clone

**Implementation:**
```typescript
// Use Mastra Workspace with GitHub resources
const workspace = await this.mastraWorkspaceFactory.createWorkspace(
  workspaceId,
  repositoryName,
  commitSha,
  accessToken
);

// Workspace provides:
// - GitHub API access via skills
// - Repository index for file discovery
// - Selective file reading (not bulk cloning)
```

### 2. Skill-Based Validation

**Decision:** Use Mastra Skills for targeted validation checks.

**Available Skills** (Story 7.2):
- `security-quick-check` - Verify security packages, scan for secrets
- `architecture-quick-check` - Check layer boundaries, module structure
- `dependency-quick-check` - Validate npm packages exist
- `test-pattern-quick-check` - Verify test file patterns

**Skill Selection Strategy:**
```typescript
// Extract keywords from ticket
const keywords = this.extractKeywords(aec);
// Example: ['security', 'auth', 'helmet']

// Match to relevant skills (max 2)
const skills = workspace.skills.filter(skill => 
  keywords.some(kw => skill.tags.includes(kw))
).slice(0, 2);

// Add skill instructions to agent context
const agent = new Agent({
  workspace,
  instructions: `${baseInstructions}\n\nAVAILABLE SKILLS:\n${skillList}`
});
```

### 3. Mastra Agent with Structured Output

**Decision:** Use Mastra Agent with:
- Structured output (Zod schema) for consistent findings
- Workspace tools (GitHub API, file reading)
- Skill-guided instructions
- Token limits and timeouts

**Example:**
```typescript
const result = await agent.generate(prompt, {
  structuredOutput: {
    schema: findingsSchema, // Zod schema for findings
  },
  maxSteps: 7, // Limit tool calls
});
```

### 4. Memory Optimization for Indexing

**Problem:** Backend ran out of memory indexing large repos (4GB heap exhausted).

**Solutions Implemented:**

#### A. File Filtering
```typescript
// Skip large files (>5MB)
// Skip binary files (.png, .jpg, .woff, etc.)
// Skip generated directories (node_modules, dist, .next)
// Limit to 10,000 files maximum
```

#### B. Batch Processing
```typescript
// Process files in batches of 50
// Force GC between batches
// Read files with 2MB content limit
```

#### C. Node.js Memory Limit
```json
// package.json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=4096' nest start --watch"
  }
}
```

### 5. Validation Strategy

**Three-Phase Approach:**

#### Phase 1: Parse Acceptance Criteria
Extract TOP 3 critical assumptions from ticket AC.

Example:
```
Ticket: "Add helmet security middleware"
Top 3 Assumptions:
1. helmet package available
2. main.ts exists and accessible  
3. TypeScript compiles
```

#### Phase 2: Targeted Checks
For each assumption, run ONE quick check:

```typescript
// Assumption 1: helmet package available
execute_command("npm list helmet") 
// → FAIL ❌ = Create finding

// Assumption 2: main.ts exists
list_files("src") 
// → OK ✅ = Skip (no finding)

// Assumption 3: Skip (already found blocker)
```

#### Phase 3: Return Findings
Only report BLOCKERS:
- Critical dependencies missing
- Architecture violations  
- Security gaps
- Build errors

**Skip** if check passes (no finding needed).

---

## Implementation Details

### QuickPreflightValidator Service

**Location:** `backend/src/validation/agents/QuickPreflightValidator.ts`

**Key Methods:**

```typescript
class QuickPreflightValidator {
  // Main entry point
  async validate(aec: AEC, workspace: Workspace): Promise<Finding[]>
  
  // Skill selection
  private async selectRelevantSkills(aec: AEC, workspace: Workspace)
  
  // Agent creation with skills
  private createPreflightAgent(workspace: Workspace, skills: any[])
  
  // Efficient prompt generation  
  private buildEfficientPrompt(aec: AEC): string
  
  // Extract findings from structured output
  private extractFindings(result: any): Finding[]
}
```

### Integration with Ticket Creation

```typescript
// GenerateTicketUseCase.ts
const preflightFindings = await this.validationEngine.runPreflight(
  aec,
  workspace
);

// Store findings on ticket
aec.addPreImplementationFindings(preflightFindings);
```

### Performance Monitoring

```typescript
// Track metrics for each validation
{
  executionTime: 15000,      // 15 seconds
  tokenUsage: 3500,          // 3.5k tokens
  toolCalls: 5,              // 5 tool calls
  cost: 0.023,               // $0.023
  findingsCount: 2           // 2 blockers found
}
```

---

## Consequences

### Positive

✅ **Fast validation** - 10-30 seconds per ticket  
✅ **Low cost** - $0.01-0.05 per validation  
✅ **Catches blockers early** - Before implementation starts  
✅ **Scalable** - Works with large repos via GitHub API  
✅ **Skill-based** - Reusable patterns across tickets  
✅ **Memory efficient** - Batch processing prevents OOM

### Negative

⚠️ **Not comprehensive** - Quick checks only, not full analysis  
⚠️ **Depends on skills** - Quality depends on skill definitions  
⚠️ **GitHub API limits** - Rate limiting on large validation volumes  
⚠️ **Network dependent** - Requires GitHub API access

### Mitigations

- Use repository index to minimize API calls
- Cache workspace resources between validations  
- Implement skill versioning for quality control
- Add retry logic for API rate limits

---

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Execution Time | 10-30s | 15s (avg) |
| Token Usage | 2k-5k | 3.5k (avg) |
| Tool Calls | 3-7 | 5 (avg) |
| Cost | $0.01-0.05 | $0.023 (avg) |
| Memory Usage | <2GB | <1.5GB |

---

## Related

- Story 7.1: Mastra Workspace Configuration
- Story 7.2: Quick Check Skills
- Story 4.2: Repository Indexer
- ADR-007: Mastra Workspace Validation

---

## References

- [Mastra Workspace Documentation](https://mastra.ai/docs/workspace)
- [Mastra Agent Documentation](https://mastra.ai/docs/agents)
- [agentskills.io Spec](https://agentskills.io)
