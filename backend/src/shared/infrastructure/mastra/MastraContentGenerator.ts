import { Injectable } from '@nestjs/common';
import { generateText } from 'ai';
import { LLMConfigService } from './llm.config';
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
 * Uses ai-sdk with provider toggle:
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

  async extractIntent(input: {
    title: string;
    description?: string;
  }): Promise<IntentExtraction> {
    const model = this.llmConfig.getModel('fast');

    const prompt = `Extract the core intent and relevant keywords from this ticket request:

Title: ${input.title}
Description: ${input.description || 'N/A'}

Respond with JSON:
{
  "intent": "clear statement of what user wants to accomplish",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const result = await generateText({
      model,
      prompt,
    });

    // Parse structured output
    const parsed = JSON.parse(result.text);
    return {
      intent: parsed.intent,
      keywords: parsed.keywords,
    };
  }

  async detectType(intent: string): Promise<TypeDetection> {
    const model = this.llmConfig.getModel('fast');

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

    const result = await generateText({
      model,
      prompt,
    });

    const parsed = JSON.parse(result.text);
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
    const model = this.llmConfig.getModel('main'); // Use main model for quality

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

    const result = await generateText({
      model,
      prompt,
    });

    const parsed = JSON.parse(result.text);
    return {
      acceptanceCriteria: parsed.acceptanceCriteria,
      assumptions: parsed.assumptions,
      repoPaths: parsed.repoPaths,
    };
  }

  async generateQuestions(input: {
    draft: TicketDraft;
    validationIssues: any[];
  }): Promise<QuestionSet> {
    const model = this.llmConfig.getModel('fast');

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

    const result = await generateText({
      model,
      prompt,
    });

    const parsed = JSON.parse(result.text);
    return {
      questions: parsed.questions,
    };
  }
}
