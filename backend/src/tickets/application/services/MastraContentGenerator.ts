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
import { LLMConfigService } from '../../../shared/infrastructure/mastra/llm.config';
import { getTelemetry } from './WorkflowTelemetry';

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
  private useFallback: boolean = false; // Use LLM for real content generation
  private ollamaBaseUrl: string;
  private ollamaModel: string;
  
  constructor(private readonly llmConfig: LLMConfigService) {
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MAIN_MODEL || 'llama3.2';
    console.log(`✅ MastraContentGenerator initialized with Ollama: ${this.ollamaBaseUrl} model: ${this.ollamaModel}`);
  }

  /**
   * Call Ollama API for text generation with timeout
   */
  private async callOllama(prompt: string, timeoutMs: number = 60000): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

    try {
      console.log(`🤖 [LLM] Calling ${this.ollamaModel} (timeout: ${timeoutMs/1000}s)`);
      console.log(`🤖 [LLM] Prompt length: ${prompt.length} chars`);
      
      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt,
          stream: false,
          options: { temperature: 0.3 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        getTelemetry().recordLLMCall(this.ollamaModel, prompt.length, 0, durationMs, false, `HTTP ${response.status}`);
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const responseLength = data.response?.length || 0;
      
      getTelemetry().recordLLMCall(this.ollamaModel, prompt.length, responseLength, durationMs, true);
      console.log(`🤖 [LLM] ✅ Response: ${responseLength} chars in ${durationMs}ms`);
      
      return data.response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        getTelemetry().recordLLMCall(this.ollamaModel, prompt.length, 0, durationMs, false, 'Timeout');
        throw new Error(`Ollama timeout after ${timeoutMs/1000}s - is Ollama running?`);
      }
      
      getTelemetry().recordLLMCall(this.ollamaModel, prompt.length, 0, durationMs, false, error.message);
      throw error;
    }
  }

  /**
   * Extract JSON from LLM response (handles markdown code blocks)
   */
  private extractJson(text: string): any {
    // Try to find JSON in code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try parsing raw text
    return JSON.parse(text.trim());
  }

  /**
   * Step 1: Extract Intent
   */
  async extractIntent(input: {
    title: string;
    description: string;
  }): Promise<ExtractIntentResult> {
    const prompt = `Analyze this ticket request and extract the user's intent and technical keywords.

Title: ${input.title}
Description: ${input.description || '(No description provided)'}

Respond ONLY with valid JSON (no explanation):
{
  "intent": "A clear, concise statement of what the user wants to accomplish",
  "keywords": ["technical", "terms", "mentioned"]
}`;

    try {
      const response = await this.callOllama(prompt);
      const parsed = this.extractJson(response);
      console.log('[MastraContentGenerator] extractIntent result:', parsed);
      return {
        intent: parsed.intent || input.title,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      };
    } catch (error) {
      console.error('[MastraContentGenerator] LLM failed for extractIntent, using fallback:', error);
      return {
        intent: input.title,
        keywords: this.extractKeywordsFromText(input.title + ' ' + (input.description || '')),
      };
    }
  }

  /**
   * Simple keyword extraction from text
   */
  private extractKeywordsFromText(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const technicalTerms = words.filter(w => 
      w.length > 3 && 
      !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will', 'should'].includes(w)
    );
    return [...new Set(technicalTerms)].slice(0, 5);
  }

  /**
   * Step 2: Detect Type
   */
  async detectType(intent: string): Promise<DetectTypeResult> {
    const prompt = `Classify this ticket into one of these types:
- FEATURE: New functionality
- BUG: Fix existing broken behavior  
- REFACTOR: Improve code without changing behavior
- CHORE: Maintenance, dependencies, tooling
- SPIKE: Research, investigation, prototyping

Ticket intent: "${intent}"

Respond ONLY with valid JSON (no explanation):
{
  "type": "FEATURE",
  "confidence": 0.85
}`;

    try {
      const response = await this.callOllama(prompt);
      const parsed = this.extractJson(response);
      console.log('[MastraContentGenerator] detectType result:', parsed);
      const validTypes = ['FEATURE', 'BUG', 'REFACTOR', 'CHORE', 'SPIKE'];
      return {
        type: validTypes.includes(parsed.type) ? parsed.type : 'FEATURE',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      };
    } catch (error) {
      console.error('[MastraContentGenerator] LLM failed for detectType, using fallback:', error);
      return this.detectTypeFromKeywords(intent);
    }
  }

  /**
   * Simple keyword-based type detection
   */
  private detectTypeFromKeywords(intent: string): DetectTypeResult {
    const lowerIntent = intent.toLowerCase();
    
    if (lowerIntent.includes('bug') || lowerIntent.includes('fix') || lowerIntent.includes('broken')) {
      return { type: 'BUG', confidence: 0.7 };
    }
    if (lowerIntent.includes('refactor') || lowerIntent.includes('cleanup') || lowerIntent.includes('restructure')) {
      return { type: 'REFACTOR', confidence: 0.7 };
    }
    if (lowerIntent.includes('chore') || lowerIntent.includes('update') || lowerIntent.includes('dependency')) {
      return { type: 'CHORE', confidence: 0.7 };
    }
    if (lowerIntent.includes('spike') || lowerIntent.includes('research') || lowerIntent.includes('investigate')) {
      return { type: 'SPIKE', confidence: 0.7 };
    }
    
    // Default to FEATURE
    return { type: 'FEATURE', confidence: 0.6 };
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
    const prompt = `You are a technical product manager. Generate detailed acceptance criteria for this ticket.

TICKET INTENT: ${input.intent}
TICKET TYPE: ${input.type}
${input.repoContext ? `\nREPOSITORY CONTEXT:\n${input.repoContext}` : ''}
${input.apiContext ? `\nAPI CONTEXT:\n${input.apiContext}` : ''}

Generate comprehensive acceptance criteria that are:
- Specific and testable
- Clear about expected behavior
- Include success and error cases

Respond ONLY with valid JSON (no explanation):
{
  "acceptanceCriteria": [
    "When [condition], the system should [behavior]",
    "Given [context], then [expected outcome]",
    "The feature must handle [edge case] by [behavior]"
  ],
  "assumptions": [
    "Technical assumption 1",
    "Business assumption 2"
  ],
  "repoPaths": ["src/path/to/relevant/file.ts"]
}`;

    try {
      console.log('[MastraContentGenerator] Calling LLM for generateDraft...');
      const response = await this.callOllama(prompt);
      const parsed = this.extractJson(response);
      
      console.log('[MastraContentGenerator] LLM generated draft:', {
        acCount: parsed.acceptanceCriteria?.length || 0,
        assumptionsCount: parsed.assumptions?.length || 0
      });
      
      return {
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria) ? parsed.acceptanceCriteria : [
          `Implement: ${input.intent}`,
          'Add appropriate unit tests',
        ],
        assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [
          'Implementation follows existing patterns',
        ],
        repoPaths: Array.isArray(parsed.repoPaths) ? parsed.repoPaths : [],
      };
    } catch (error) {
      console.error('[MastraContentGenerator] LLM failed, using fallback:', error);
      // Fallback: Return minimal structure
      return {
        acceptanceCriteria: [
          `Implement: ${input.intent}`,
          'Add appropriate unit tests',
          'Update documentation as needed',
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
