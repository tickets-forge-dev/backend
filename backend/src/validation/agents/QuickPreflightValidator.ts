import { Agent } from '@mastra/core/agent';
import { Workspace } from '@mastra/core/workspace';
import { Injectable, Logger } from '@nestjs/common';
import { AEC } from '../../tickets/domain/aec/AEC';
import { Finding, FindingFactory } from '../domain/Finding';
import { z } from 'zod';

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

  // Structured output schema for agent response
  private readonly findingsSchema = z.object({
    findings: z.array(
      z.object({
        category: z.enum([
          'gap',
          'conflict',
          'missing-dependency',
          'architectural-mismatch',
          'security',
        ]),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
        codeLocation: z.string().optional(),
        suggestion: z.string(),
        evidence: z.string().optional(),
        confidence: z.number().min(0).max(1),
      }),
    ),
  });

  // Performance metrics tracking
  private performanceMetrics = {
    executionTime: 0,
    tokenUsage: 0,
    toolCalls: 0,
    cost: 0,
  };

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

    // Reset performance metrics
    this.performanceMetrics = {
      executionTime: 0,
      tokenUsage: 0,
      toolCalls: 0,
      cost: 0,
    };

    try {
      // Discover and select relevant skills
      const selectedSkills = await this.selectRelevantSkills(aec, workspace);
      this.logger.log(
        `📚 Selected ${selectedSkills.length} skills: ${selectedSkills.map((s) => s.name).join(', ')}`,
      );

      // Create efficient preflight agent with skill instructions
      const agent = this.createPreflightAgent(workspace, selectedSkills);

      // Generate validation prompt with assumptions
      const prompt = this.buildEfficientPrompt(aec);

      // Run agent with timeout and structured output
      const result = await Promise.race([
        agent.generate(prompt, {
          structuredOutput: {
            schema: this.findingsSchema,
          },
          maxSteps: this.MAX_TOOL_CALLS,
        }),
        this.timeout(this.MAX_EXECUTION_TIME_MS),
      ]) as any;

      // Extract findings from structured output
      const findings = this.extractFindings(result);

      // Track performance metrics
      const duration = Date.now() - startTime;
      this.performanceMetrics.executionTime = duration;
      
      // Log performance metrics
      this.logPerformanceMetrics(findings.length);

      // Alert if exceeding constraints
      if (duration > 25000) {
        this.logger.warn(`⚠️ Validation took ${duration}ms (approaching 30s limit)`);
      }

      this.logger.log(
        `✅ Preflight complete: ${findings.length} findings in ${duration}ms`,
      );

      return findings;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Preflight failed after ${duration}ms: ${error.message}`,
      );

      // Return empty findings on error (don't block ticket creation)
      return [];
    }
  }

  /**
   * Select relevant skills based on AEC keywords
   */
  private async selectRelevantSkills(
    aec: AEC,
    workspace: Workspace,
  ): Promise<any[]> {
    try {
      // Get all available skills from workspace
      const allSkills = workspace.skills || [];

      // Extract keywords from title and AC
      const keywords = this.extractKeywords(aec);
      this.logger.debug(`Keywords extracted: ${keywords.join(', ')}`);

      // Match skills to keywords (select max 2 skills)
      const relevantSkills = allSkills
        .filter((skill: any) => {
          // Check if any keyword matches skill activation criteria
          const skillKeywords = [
            ...((skill.tags as string[]) || []),
            skill.name?.toLowerCase() || '',
            skill.description?.toLowerCase() || '',
          ];

          return keywords.some((keyword) =>
            skillKeywords.some((sk) => sk.includes(keyword)),
          );
        })
        .slice(0, 2); // Limit to 2 skills max

      return relevantSkills;
    } catch (error) {
      this.logger.warn('Failed to select skills, continuing without skills');
      return [];
    }
  }

  /**
   * Extract keywords from AEC title and acceptance criteria
   */
  private extractKeywords(aec: AEC): string[] {
    const text = `${aec.title} ${aec.acceptanceCriteria.join(' ')}`.toLowerCase();

    const keywordPatterns = {
      security: [
        'security',
        'auth',
        'helmet',
        'cors',
        'csrf',
        'xss',
        'password',
        'token',
      ],
      architecture: [
        'layer',
        'module',
        'architecture',
        'structure',
        'boundary',
        'domain',
        'clean architecture',
      ],
      dependency: ['install', 'package', 'dependency', 'npm', 'pnpm', 'yarn'],
      test: ['test', 'testing', 'jest', 'spec', 'e2e', 'unit test'],
    };

    const found = new Set<string>();
    Object.entries(keywordPatterns).forEach(([category, patterns]) => {
      if (patterns.some((pattern) => text.includes(pattern))) {
        found.add(category);
      }
    });

    return Array.from(found);
  }

  /**
   * Create efficient preflight agent with skill instructions
   */
  private createPreflightAgent(
    workspace: Workspace,
    selectedSkills: any[],
  ): Agent {
    // Build skill instructions section
    const skillInstructions = selectedSkills.length > 0
      ? `\n\nAVAILABLE VALIDATION SKILLS:\n${selectedSkills.map((skill) => `- ${skill.name}: ${skill.description}`).join('\n')}\n\nUSE THESE SKILLS to guide your validation checks.`
      : '';

    return new Agent({
      id: 'quick-preflight-validator',
      name: 'Quick Preflight Validator',
      model: 'anthropic/claude-sonnet-4-20250514',
      workspace: workspace,
      instructions: `
You are a FAST ticket preflight validator. Your job is to quickly validate critical assumptions, NOT implement the full ticket.

RULES (CRITICAL):
1. Maximum ${this.MAX_TOOL_CALLS} tool calls total
2. Only check TOP 3 critical assumptions
3. Return findings ONLY for blockers
4. Skip everything that looks fine
5. Be FAST - you have 30 seconds max${skillInstructions}

AVAILABLE TOOLS:
- execute_command: Run shell commands (cat, grep, find, npm, ls, etc.)

FILE ACCESS:
- Use 'cat path/to/file' to read files
- Use 'grep -r "pattern" .' to search content
- Use 'find . -name "*.ts"' to locate files
- Use 'ls -la' to list directories
- Use 'npm list package-name' to check dependencies

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

BE FAST. BE TARGETED. FIND BLOCKERS ONLY.
      `,
    });
  }

  /**
   * Build efficient prompt with TOP 3 critical assumptions
   */
  private buildEfficientPrompt(aec: AEC): string {
    // Extract TOP 3 critical assumptions
    const topAssumptions = this.extractTopAssumptions(aec);

    return `
Quick preflight check for this ticket:

TITLE: ${aec.title}

TOP 3 CRITICAL ASSUMPTIONS TO VALIDATE:
${topAssumptions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

${aec.repoPaths.length > 0 ? `AFFECTED FILES: ${aec.repoPaths.slice(0, 3).join(', ')}` : ''}

TASK:
1. For each assumption, run ONE quick targeted check
2. Use fast commands only (npm list, grep, find, tsc --noEmit)
3. Return findings ONLY for blockers
4. Skip if everything looks fine
5. Be FAST (30 seconds max, max ${this.MAX_TOOL_CALLS} tool calls)

START VALIDATION NOW.
    `.trim();
  }

  /**
   * Extract TOP 3 critical assumptions from AC
   */
  private extractTopAssumptions(aec: AEC): string[] {
    // Take first 3 AC as critical assumptions
    // In future, could use LLM to identify most critical ones
    return aec.acceptanceCriteria.slice(0, 3);
  }

  /**
   * Extract findings from structured agent response
   */
  private extractFindings(result: any): Finding[] {
    try {
      // Structured output should be in result.object
      const data = result.object || result;

      if (!data?.findings || !Array.isArray(data.findings)) {
        this.logger.warn('No findings array in agent response');
        return [];
      }

      // Convert to Finding domain objects
      const findings = data.findings.map((f: any) =>
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

      // Limit to 10 findings max
      return findings.slice(0, 10);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to extract findings: ${err.message}`);
      return [];
    }
  }

  /**
   * Log performance metrics
   */
  private logPerformanceMetrics(findingCount: number): void {
    const { executionTime, tokenUsage, toolCalls, cost } =
      this.performanceMetrics;

    this.logger.log(`📊 Performance Metrics:
  - Execution Time: ${executionTime}ms ${executionTime > 25000 ? '⚠️ HIGH' : '✅'}
  - Token Usage: ${tokenUsage} ${tokenUsage > 4500 ? '⚠️ HIGH' : '✅'}
  - Tool Calls: ${toolCalls} ${toolCalls > 6 ? '⚠️ HIGH' : '✅'}
  - Est. Cost: $${cost.toFixed(4)}
  - Findings: ${findingCount}
    `);

    // Alert if exceeding constraints
    if (tokenUsage > 4500) {
      this.logger.warn('⚠️ Token usage approaching limit (5k)');
    }
    if (toolCalls > 6) {
      this.logger.warn('⚠️ Tool calls approaching limit (7)');
    }
    if (cost > 0.045) {
      this.logger.warn('⚠️ Cost approaching limit ($0.05)');
    }
  }

  /**
   * Get performance metrics (for use case to include in response)
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Preflight validation timeout')), ms),
    );
  }
}
