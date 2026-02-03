import { Injectable } from '@nestjs/common';
import { Agent } from '@mastra/core/agent';
import { LLMConfigService } from './llm.config';
import { createOllamaProvider } from './providers/ollama.provider';
import {
  ILLMContentGenerator,
  IntentExtraction,
  TypeDetection,
  TicketDraft,
  QuestionSet,
} from '../../application/ports/ILLMContentGenerator';

/**
 * Mastra-based LLM Content Generator
 *
 * Uses Mastra Agent API with provider toggle:
 * - Development: Ollama (local, free, fast iteration)
 * - Production: Anthropic/Claude (API, high quality)
 *
 * Toggle via LLM_PROVIDER env variable
 */
@Injectable()
export class MastraContentGenerator implements ILLMContentGenerator {
  constructor(private llmConfig: LLMConfigService) {
    console.log(
      `✅ MastraContentGenerator initialized with provider: ${llmConfig.getProvider()}`,
    );
  }

  /**
   * Create Mastra Agent with specified model
   */
  private createAgent(modelName: string): Agent {
    const provider = this.llmConfig.getProvider();
    
    const agentConfig: any = {
      id: 'content-generator',
      name: 'Content Generator',
      instructions: 'You are a helpful assistant that responds with valid JSON only. Do not add commentary, just return the requested JSON structure.',
    };

    // Configure based on provider
    if (provider === 'anthropic') {
      const apiKey = this.llmConfig.getAnthropicApiKey();
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not set in .env');
      }
      agentConfig.model = modelName; // Use model string like "anthropic/claude-sonnet-4"
      agentConfig.apiKeys = {
        ANTHROPIC_API_KEY: apiKey,
      };
    } else if (provider === 'ollama') {
      // For Ollama, create model instance using AI SDK
      const baseURL = this.llmConfig.getOllamaBaseUrl();
      const ollamaProvider = createOllamaProvider(baseURL);
      // Extract model name without provider prefix
      const modelId = modelName.replace('ollama/', '');
      agentConfig.model = ollamaProvider.chat(modelId);
    }

    return new Agent(agentConfig);
  }

  /**
   * Strip markdown code blocks from LLM response and extract JSON
   * LLMs often wrap JSON in ```json...``` blocks and add extra text
   */
  private stripMarkdown(text: string): string {
    let cleaned = text.trim();

    // If wrapped in code fence, extract content between fences
    if (cleaned.includes('```')) {
      // Match content between ```json and ``` (or just ``` and ```)
      const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match && match[1]) {
        cleaned = match[1].trim();
      } else {
        // Fallback: simple fence removal
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
          cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();
      }
    }

    // Additional safety: try to find JSON object/array if still has extra text
    // This handles cases where LLM adds commentary before/after JSON
    if (cleaned.includes('\n\n') || (!cleaned.startsWith('{') && !cleaned.startsWith('['))) {
      const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch && jsonMatch[1]) {
        cleaned = jsonMatch[1].trim();
      }
    }

    return cleaned;
  }

  async extractIntent(input: {
    title: string;
    description?: string;
  }): Promise<IntentExtraction> {
    console.log('🤖 [MastraContentGenerator] extractIntent called');
    const modelName = this.llmConfig.getModelName('fast');
    const agent = this.createAgent(modelName);

    const prompt = `Extract the core intent and relevant keywords from this ticket request:

Title: ${input.title}
Description: ${input.description || 'N/A'}

Respond with JSON:
{
  "intent": "clear statement of what user wants to accomplish",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    console.log('🤖 [MastraContentGenerator] Calling LLM...');
    
    try {
      const result = await agent.generate(prompt);

      console.log('🤖 [MastraContentGenerator] LLM response received:', result.text.substring(0, 100));

      // Parse structured output (strip markdown if present)
      const parsed = JSON.parse(this.stripMarkdown(result.text));
      return {
        intent: parsed.intent,
        keywords: parsed.keywords,
      };
    } catch (error) {
      console.error('❌ [MastraContentGenerator] extractIntent failed:', error);
      throw error;
    }
  }

  async detectType(intent: string): Promise<TypeDetection> {
    const modelName = this.llmConfig.getModelName('fast');
    const agent = this.createAgent(modelName);

    const prompt = `Classify this ticket intent as feature, bug, or task:

Intent: ${intent}

Respond with JSON:
{
  "type": "feature" | "bug" | "task",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Guidelines:
- "feature" = new functionality
- "bug" = fix broken behavior
- "task" = chore, refactor, documentation, cleanup`;

    const result = await agent.generate(prompt);

    const parsed = JSON.parse(this.stripMarkdown(result.text));
    return {
      type: parsed.type,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  }

  async generateDraft(input: {
    intent: string;
    type: 'feature' | 'bug' | 'task';
    repoContext?: string;
    apiContext?: string;
  }): Promise<TicketDraft> {
    const modelName = this.llmConfig.getModelName('main'); // Use main model for quality
    const agent = this.createAgent(modelName);

    const prompt = `Generate a draft executable ticket for this ${input.type}:

Intent: ${input.intent}

${input.repoContext ? `Repository Context:\n${input.repoContext}` : ''}
${input.apiContext ? `API Context:\n${input.apiContext}` : ''}

Respond with JSON:
{
  "acceptanceCriteria": ["AC1 in Given/When/Then format", "AC2", ...],
  "assumptions": ["assumption1", "assumption2", ...],
  "repoPaths": ["path/to/file1.ts", "path/to/file2.ts", ...]
}

Guidelines:
- Acceptance criteria must be testable (Given/When/Then format)
- Assumptions should be explicit (no hidden decisions)
- Repo paths should be actual files likely to change (based on context)
- Keep it concise and actionable`;

    const result = await agent.generate(prompt);

    const parsed = JSON.parse(this.stripMarkdown(result.text));

    // Normalize acceptance criteria to strings (LLM might return objects with {given, when, then})
    const normalizedAC = this.normalizeAcceptanceCriteria(parsed.acceptanceCriteria);

    return {
      acceptanceCriteria: normalizedAC,
      assumptions: parsed.assumptions,
      repoPaths: parsed.repoPaths,
    };
  }

  /**
   * Normalize acceptance criteria to string format
   * LLMs sometimes return {given, when, then} objects instead of strings
   */
  private normalizeAcceptanceCriteria(criteria: any[]): string[] {
    if (!Array.isArray(criteria)) {
      return [];
    }

    return criteria.map((ac, index) => {
      // If it's already a string, return as-is
      if (typeof ac === 'string') {
        return ac;
      }

      // If it's an object with {given, when, then}, convert to string
      if (typeof ac === 'object' && ac !== null) {
        if (ac.given && ac.when && ac.then) {
          return `Given ${ac.given}, When ${ac.when}, Then ${ac.then}`;
        }
        // Fallback: stringify the object
        return JSON.stringify(ac);
      }

      // Fallback: convert to string
      return String(ac);
    });
  }

  async generateQuestions(input: {
    draft: TicketDraft;
    validationIssues: any[];
  }): Promise<QuestionSet> {
    const modelName = this.llmConfig.getModelName('fast');
    const agent = this.createAgent(modelName);

    const prompt = `Generate max 3 clarification questions based on these validation issues:

Validation Issues:
${JSON.stringify(input.validationIssues, null, 2)}

Current Draft:
${JSON.stringify(input.draft, null, 2)}

Respond with JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text?",
      "type": "binary" | "multi-choice",
      "options": [{"label": "Option 1", "value": "opt1"}, ...],
      "defaultAssumption": "What we'll assume if not answered"
    }
  ]
}

Guidelines:
- Max 3 questions
- Ask only what changes execution (no subjective questions)
- Prefer binary questions (Yes/No)
- Each question must have 2-4 options
- Default assumption required for each`;

    const result = await agent.generate(prompt);

    const parsed = JSON.parse(this.stripMarkdown(result.text));
    return {
      questions: parsed.questions,
    };
  }
}
