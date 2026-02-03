/**
 * Mastra Content Generator
 *
 * LLM service for ticket generation workflow steps.
 * Provides three main capabilities:
 * 1. Extract intent and keywords from user input
 * 2. Detect ticket type (FEATURE, BUG, REFACTOR, CHORE, SPIKE)
 * 3. Generate draft content (acceptance criteria, assumptions, repo paths)
 *
 * All methods include graceful fallbacks to prevent workflow failures.
 */

import { Injectable } from '@nestjs/common';
import { LLMConfigService } from '../../../shared/infrastructure/llm/llm-config.service';

export interface ExtractIntentResult {
  intent: string;
  keywords: string[];
}

export interface DetectTypeResult {
  type: 'FEATURE' | 'BUG' | 'REFACTOR' | 'CHORE' | 'SPIKE';
  confidence: number;
}

export interface GenerateDraftResult {
  acceptanceCriteria: string[];
  assumptions: string[];
  repoPaths: string[];
}

@Injectable()
export class MastraContentGenerator {
  constructor(private readonly llmConfig: LLMConfigService) {}

  /**
   * Step 1: Extract Intent
   *
   * Analyzes ticket title and description to extract:
   * - Core intent (what the user wants to accomplish)
   * - Keywords (technical terms, features, components)
   *
   * Fallback: Returns title as intent if LLM fails
   */
  async extractIntent(input: {
    title: string;
    description: string;
  }): Promise<ExtractIntentResult> {
    const llm = this.llmConfig.getDefaultLLM();

    const prompt = `Extract the user's intent and relevant keywords from this ticket:

Title: ${input.title}
Description: ${input.description || '(No description provided)'}

Respond with JSON:
{
  "intent": "A clear, concise statement of what the user wants to accomplish",
  "keywords": ["technical", "terms", "mentioned"]
}`;

    try {
      const response = await llm.generate(prompt);
      const parsed = JSON.parse(response);

      return {
        intent: parsed.intent || input.title,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      };
    } catch (error) {
      console.error('[MastraContentGenerator] Failed to extract intent:', error);
      // Fallback: Use title as intent
      return {
        intent: input.title,
        keywords: [],
      };
    }
  }

  /**
   * Step 2: Detect Type
   *
   * Classifies ticket based on intent:
   * - FEATURE: New functionality
   * - BUG: Fix existing broken behavior
   * - REFACTOR: Improve code without changing behavior
   * - CHORE: Maintenance, dependencies, tooling
   * - SPIKE: Research, investigation, prototyping
   *
   * Fallback: Returns FEATURE if LLM fails
   */
  async detectType(intent: string): Promise<DetectTypeResult> {
    const llm = this.llmConfig.getDefaultLLM();

    const prompt = `Classify this ticket intent into one of these types:
- FEATURE: New functionality or enhancement
- BUG: Fix existing broken behavior
- REFACTOR: Improve code structure without changing behavior
- CHORE: Maintenance, dependencies, tooling, documentation
- SPIKE: Research, investigation, proof of concept

Intent: ${intent}

Respond with JSON:
{
  "type": "FEATURE|BUG|REFACTOR|CHORE|SPIKE",
  "confidence": 0.0-1.0
}`;

    try {
      const response = await llm.generate(prompt);
      const parsed = JSON.parse(response);

      const validTypes = ['FEATURE', 'BUG', 'REFACTOR', 'CHORE', 'SPIKE'];
      const type = validTypes.includes(parsed.type) ? parsed.type : 'FEATURE';

      return {
        type: type as any,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };
    } catch (error) {
      console.error('[MastraContentGenerator] Failed to detect type:', error);
      // Fallback: Assume FEATURE
      return {
        type: 'FEATURE',
        confidence: 0.5,
      };
    }
  }

  /**
   * Step 7: Generate Draft
   *
   * Generates structured ticket content:
   * - Acceptance Criteria: Testable conditions for "done"
   * - Assumptions: Technical/business assumptions made
   * - Repo Paths: Files/directories likely to change
   *
   * Uses repository context to make code-aware suggestions.
   * Fallback: Returns minimal structure if LLM fails
   */
  async generateDraft(input: {
    intent: string;
    type: string;
    repoContext: string;
    apiContext: string;
  }): Promise<GenerateDraftResult> {
    const llm = this.llmConfig.getDefaultLLM();

    const prompt = `Generate ticket content for this ${input.type}:

Intent: ${input.intent}

Repository Context:
${input.repoContext || '(No repository context available)'}

API Context:
${input.apiContext || '(No API context available)'}

Generate:
1. Acceptance Criteria: Specific, testable conditions that define "done"
2. Assumptions: Technical or business assumptions being made
3. Repo Paths: Files/directories that will likely need changes

Respond with JSON:
{
  "acceptanceCriteria": [
    "AC #1: Specific, testable condition",
    "AC #2: Another condition"
  ],
  "assumptions": [
    "Assumption about technology/approach",
    "Assumption about scope/constraints"
  ],
  "repoPaths": [
    "path/to/likely/affected/file.ts",
    "path/to/another/file.ts"
  ]
}`;

    try {
      const response = await llm.generate(prompt);
      const parsed = JSON.parse(response);

      return {
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria)
          ? parsed.acceptanceCriteria
          : ['Generated content will be defined during implementation'],
        assumptions: Array.isArray(parsed.assumptions)
          ? parsed.assumptions
          : [],
        repoPaths: Array.isArray(parsed.repoPaths) ? parsed.repoPaths : [],
      };
    } catch (error) {
      console.error('[MastraContentGenerator] Failed to generate draft:', error);
      // Fallback: Return minimal structure
      return {
        acceptanceCriteria: [
          'Implement the requested functionality',
          'Add appropriate tests',
          'Update documentation',
        ],
        assumptions: [
          'Implementation follows existing architectural patterns',
          'No breaking changes to public APIs',
        ],
        repoPaths: [],
      };
    }
  }
}
