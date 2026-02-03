import { Agent } from '@mastra/core/agent';
import { Workspace } from '@mastra/core/workspace';
import { Injectable, Logger } from '@nestjs/common';
import { AEC } from '../../tickets/domain/aec/AEC';
import { Finding, FindingFactory } from '../domain/Finding';

/**
 * Quick Preflight Validator - Epic 7.3
 *
 * Fast, targeted validation of critical ticket assumptions.
 * NOT a full implementation tool - just validates blockers.
 *
 * Performance Targets:
 * - Time: 10-30 seconds
 * - Tokens: 2k-5k
 * - Tool calls: 3-7 max
 * - Cost: $0.01-0.05 per ticket
 *
 * Strategy:
 * 1. Parse AC to extract critical assumptions
 * 2. Run quick targeted checks only
 * 3. Return findings for blockers only
 * 4. Skip everything that looks fine
 */
@Injectable()
export class QuickPreflightValidator {
  private readonly logger = new Logger(QuickPreflightValidator.name);

  // Performance constraints
  private readonly MAX_EXECUTION_TIME_MS = 30000; // 30 seconds
  private readonly MAX_TOKENS = 5000;
  private readonly MAX_TOOL_CALLS = 7;

  /**
   * Run quick preflight validation on ticket
   *
   * @param aec - Ticket to validate
   * @param workspace - Mastra workspace with repo access
   * @returns Array of findings (blockers only)
   */
  async validate(aec: AEC, workspace: Workspace): Promise<Finding[]> {
    const startTime = Date.now();
    this.logger.log(`🚀 Starting quick preflight for ticket: ${aec.id}`);

    try {
      // Create efficient preflight agent
      const agent = this.createPreflightAgent(workspace);

      // Generate validation prompt
      const prompt = this.buildEfficientPrompt(aec);

      // Run agent with timeout
      const result = await Promise.race([
        agent.generate(prompt, {
          maxTokens: this.MAX_TOKENS,
        }),
        this.timeout(this.MAX_EXECUTION_TIME_MS),
      ]);

      // Parse findings from agent response
      const findings = this.parseFindings(result);

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Preflight complete: ${findings.length} findings in ${duration}ms`,
      );

      return findings;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Preflight failed after ${duration}ms: ${error.message}`,
      );

      // Return empty findings on error (don't block ticket creation)
      return [];
    }
  }

  /**
   * Create efficient preflight agent with strict constraints
   */
  private createPreflightAgent(workspace: Workspace): Agent {
    return new Agent({
      id: 'quick-preflight-validator',
      model: 'anthropic/claude-sonnet-4.5',
      workspace: workspace,
      instructions: `
You are a FAST ticket preflight validator. Your job is to quickly validate critical assumptions, NOT implement the full ticket.

RULES (CRITICAL):
1. Maximum ${this.MAX_TOOL_CALLS} tool calls total
2. Only check TOP 3 critical assumptions
3. Return findings ONLY for blockers
4. Skip everything that looks fine
5. Be FAST - you have 30 seconds max

AVAILABLE TOOLS:
- read_file: Read source files (use sparingly!)
- list_files: List directory contents
- execute_command: Run npm, grep, find, tsc commands

STRATEGY:
1. Parse acceptance criteria to identify assumptions
2. For each assumption, run ONE quick check
3. If check passes → skip, no finding
4. If check fails → create finding with evidence
5. Stop after finding 3 blockers

EXAMPLE GOOD BEHAVIOR:
Ticket: "Add helmet security headers"
Assumptions:
  1. helmet package available
  2. main.ts exists and accessible
  3. TypeScript compiles

Checks:
  1. execute_command("npm list helmet") → FAIL ❌
     Finding: helmet not installed
  2. execute_command("find src -name main.ts") → OK ✅
     Skip (no finding)
  3. Skip (already have blocker)

Result: 1 finding, 2 tool calls, 5 seconds ✅

EXAMPLE BAD BEHAVIOR (DON'T DO THIS):
- Reading 20 files to understand architecture
- Running full test suite
- Writing complete implementation
- Exploring entire codebase
- Deep analysis of patterns

OUTPUT FORMAT:
Return JSON array of findings:
{
  "findings": [
    {
      "category": "missing-dependency",
      "severity": "critical",
      "description": "helmet package not installed",
      "codeLocation": "package.json",
      "suggestion": "Install helmet: pnpm add helmet",
      "evidence": "$ npm list helmet\\n└── (empty)",
      "confidence": 0.95
    }
  ]
}

BE FAST. BE TARGETED. FIND BLOCKERS ONLY.
      `,
    });
  }

  /**
   * Build efficient prompt with only essential information
   */
  private buildEfficientPrompt(aec: AEC): string {
    // Limit AC to first 5 (most critical usually come first)
    const topAC = aec.acceptanceCriteria.slice(0, 5);

    return `
Quick preflight check for this ticket:

TITLE: ${aec.title}

ACCEPTANCE CRITERIA (top ${topAC.length}):
${topAC.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

${aec.repoPaths.length > 0 ? `AFFECTED FILES: ${aec.repoPaths.slice(0, 3).join(', ')}` : ''}

TASK:
1. Identify TOP 3 critical assumptions from these AC
2. Run quick targeted checks (max ${this.MAX_TOOL_CALLS} tool calls)
3. Return findings ONLY for blockers
4. Be FAST (30 seconds max)

START VALIDATION NOW.
    `.trim();
  }

  /**
   * Parse findings from agent response
   */
  private parseFindings(result: any): Finding[] {
    try {
      // Agent should return structured JSON
      const data =
        typeof result === 'string' ? JSON.parse(result) : result.data || result;

      if (!data.findings || !Array.isArray(data.findings)) {
        this.logger.warn('No findings array in agent response');
        return [];
      }

      // Convert to Finding domain objects
      return data.findings.map((f: any) =>
        FindingFactory.create({
          category: f.category,
          severity: f.severity,
          description: f.description,
          codeLocation: f.codeLocation,
          suggestion: f.suggestion,
          evidence: f.evidence,
          confidence: f.confidence || 0.8,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to parse findings: ${error.message}`);
      return [];
    }
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Preflight validation timeout')), ms),
    );
  }

  /**
   * Extract assumptions from acceptance criteria (helper for future optimization)
   */
  private extractAssumptions(acceptanceCriteria: string[]): string[] {
    // TODO: Smart assumption extraction
    // For now, just return AC as-is
    return acceptanceCriteria;
  }
}
