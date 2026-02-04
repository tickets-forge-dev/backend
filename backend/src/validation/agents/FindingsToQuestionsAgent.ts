/**
 * Findings to Questions Agent
 *
 * Converts validation findings and draft content into clarifying questions
 * for the user. Used in workflow step 8 to generate questions that help
 * refine acceptance criteria and identify missing requirements.
 *
 * Question Generation Strategy:
 * 1. CRITICAL findings → Questions about requirements/scope
 * 2. WARNING findings → Questions about edge cases/error handling
 * 3. Missing details in AC → Questions about implementation specifics
 * 4. Vague assumptions → Questions about technical choices
 *
 * Questions are designed to be:
 * - Specific and actionable
 * - Non-technical (accessible to product owners)
 * - Focused on "what" not "how"
 * - Multiple choice when possible
 */

import { Injectable } from '@nestjs/common';
import { LLMConfigService } from '../../shared/infrastructure/mastra/llm.config';
import { getTelemetry } from '../../tickets/application/services/WorkflowTelemetry';

export interface Finding {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'multiple_choice' | 'single_choice';
  options?: string[];
  context?: string;
  relatedFinding?: string;
}

export interface GenerateQuestionsInput {
  findings: Finding[];
  acceptanceCriteria: string[];
  assumptions: string[];
}

@Injectable()
export class FindingsToQuestionsAgent {
  constructor(private readonly llmConfig: LLMConfigService) {}

  /**
   * Generate clarifying questions from findings and draft content
   *
   * @param input - Findings, acceptance criteria, and assumptions
   * @returns Array of questions for user to answer
   */
  async generateQuestions(
    input: GenerateQuestionsInput,
  ): Promise<Question[]> {
    const startTime = Date.now();
    const telemetry = getTelemetry();
    
    telemetry.info('FindingsToQuestionsAgent: Starting question generation', {
      agent: 'FindingsToQuestionsAgent',
      findingsCount: input.findings.length,
      acCount: input.acceptanceCriteria.length,
      assumptionsCount: input.assumptions.length,
    });

    const llm = this.llmConfig.getDefaultLLM();

    // Check if we should skip questions
    const shouldSkip = this.shouldSkipQuestions(input.findings, input.acceptanceCriteria);
    
    // If AC is minimal (< 3 items), always generate clarifying questions
    const needsClarification = input.acceptanceCriteria.length < 3;
    
    if (shouldSkip && !needsClarification) {
      console.log('[FindingsToQuestionsAgent] No questions needed - draft looks good');
      telemetry.info('FindingsToQuestionsAgent: Skipping questions - AC looks good', {
        agent: 'FindingsToQuestionsAgent',
        reason: 'No critical findings + good AC quality',
      });
      return [];
    }

    const prompt = this.buildPrompt(input);

    try {
      const response = await llm.generate(prompt);
      const duration = Date.now() - startTime;
      
      // Record LLM call
      telemetry.recordLLMCall(
        'mastra-default-llm',
        prompt.substring(0, 150),
        response.substring(0, 150),
        {
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: Math.ceil(response.length / 4),
          totalTokens: Math.ceil((prompt.length + response.length) / 4),
          duration,
          success: true,
        }
      );

      // Try to extract JSON from response
      let parsed;
      try {
        // Try to find JSON in response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(response);
        }
      } catch {
        console.warn('[FindingsToQuestionsAgent] Failed to parse LLM response, using fallback');
        telemetry.warn('FindingsToQuestionsAgent: LLM response parse failed, using fallback', {
          agent: 'FindingsToQuestionsAgent',
          responseLength: response.length,
        });
        return this.generateDefaultQuestions(input.acceptanceCriteria);
      }

      // Validate and format questions
      const questions = this.validateQuestions(parsed.questions || []);

      if (questions.length === 0) {
        // LLM returned no valid questions, generate defaults
        telemetry.info('FindingsToQuestionsAgent: LLM returned no valid questions, using defaults', {
          agent: 'FindingsToQuestionsAgent',
        });
        return this.generateDefaultQuestions(input.acceptanceCriteria);
      }

      console.log(`[FindingsToQuestionsAgent] Generated ${questions.length} questions`);
      
      const totalDuration = Date.now() - startTime;
      telemetry.info('FindingsToQuestionsAgent: Questions generated successfully', {
        agent: 'FindingsToQuestionsAgent',
        questionsCount: questions.length,
        duration: totalDuration,
      });
      
      return questions;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[FindingsToQuestionsAgent] Failed to generate questions:', error);
      
      telemetry.error('FindingsToQuestionsAgent: Question generation failed', error as Error, {
        agent: 'FindingsToQuestionsAgent',
        duration,
      });
      
      // Fallback: Generate default clarifying questions
      return this.generateDefaultQuestions(input.acceptanceCriteria);
    }
  }

  /**
   * Decide if questions should be skipped
   *
   * Skip if:
   * - No critical findings
   * - AC has 3+ specific criteria
   * - No vague language in AC ("should", "may", "possibly")
   */
  private shouldSkipQuestions(
    findings: Finding[],
    acceptanceCriteria: string[],
  ): boolean {
    const hasCriticalFindings = findings.some(
      (f) => f.severity === 'critical',
    );

    const hasEnoughCriteria = acceptanceCriteria.length >= 3;

    const hasVagueLanguage = acceptanceCriteria.some((ac) =>
      /\b(should|may|possibly|probably|might|could)\b/i.test(ac),
    );

    // Skip if no critical findings AND AC is detailed
    return !hasCriticalFindings && hasEnoughCriteria && !hasVagueLanguage;
  }

  /**
   * Build LLM prompt for question generation
   */
  private buildPrompt(input: GenerateQuestionsInput): string {
    const findingsText = input.findings
      .map(
        (f) =>
          `- [${f.severity.toUpperCase()}] ${f.category}: ${f.message}${f.suggestion ? `\n  Suggestion: ${f.suggestion}` : ''}`,
      )
      .join('\n');

    const acText = input.acceptanceCriteria
      .map((ac, i) => `${i + 1}. ${ac}`)
      .join('\n');

    const assumptionsText = input.assumptions
      .map((a, i) => `${i + 1}. ${a}`)
      .join('\n');

    return `You are a product requirements expert. Generate clarifying questions to help refine this ticket.

VALIDATION FINDINGS:
${findingsText || '(No findings)'}

ACCEPTANCE CRITERIA (DRAFT):
${acText || '(None generated)'}

ASSUMPTIONS (DRAFT):
${assumptionsText || '(None generated)'}

Generate 2-5 questions that will help clarify requirements and improve ticket quality.

QUESTION GUIDELINES:
- Focus on critical findings first
- Ask about missing details in acceptance criteria
- Clarify vague assumptions
- Use multiple choice when possible
- Keep language non-technical
- Focus on "what" not "how"

Respond with JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "What should happen when...?",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C"],
      "context": "This question addresses the critical finding about...",
      "relatedFinding": "category-name"
    }
  ]
}

Question types:
- "text": Short answer (e.g., "What should the API endpoint be named?")
- "textarea": Long answer (e.g., "Describe the expected error handling...")
- "multiple_choice": Checkboxes (e.g., "Which file formats?")
- "single_choice": Radio buttons (e.g., "Should this be a modal or page?")`;
  }

  /**
   * Validate and sanitize LLM-generated questions
   */
  private validateQuestions(questions: any[]): Question[] {
    return questions
      .filter((q) => {
        // Must have id, text, and type
        if (!q.id || !q.text || !q.type) return false;

        // Type must be valid
        const validTypes = [
          'text',
          'textarea',
          'multiple_choice',
          'single_choice',
        ];
        if (!validTypes.includes(q.type)) return false;

        // Multiple/single choice must have options
        if (
          (q.type === 'multiple_choice' || q.type === 'single_choice') &&
          (!Array.isArray(q.options) || q.options.length < 2)
        ) {
          return false;
        }

        return true;
      })
      .map((q, index) => ({
        id: q.id || `q${index + 1}`,
        text: q.text,
        type: q.type,
        options: q.options || undefined,
        context: q.context || undefined,
        relatedFinding: q.relatedFinding || undefined,
      }));
  }

  /**
   * Generate basic questions from critical findings (fallback)
   */
  private generateFallbackQuestions(findings: Finding[]): Question[] {
    const criticalFindings = findings.filter(
      (f) => f.severity === 'critical',
    );

    if (criticalFindings.length === 0) {
      return [];
    }

    // Generate one question per critical finding
    return criticalFindings.slice(0, 3).map((finding, index) => ({
      id: `fallback-${index + 1}`,
      text: `${finding.message}\n\nHow should this be handled?`,
      type: 'textarea' as const,
      context: finding.suggestion || undefined,
      relatedFinding: finding.category,
    }));
  }

  /**
   * Refine acceptance criteria based on user answers
   *
   * Called by workflow step 10 (refineDraft) if user provided answers.
   * Uses LLM to incorporate answers into acceptance criteria.
   */
  async refineAcceptanceCriteria(
    acceptanceCriteria: string[],
    questions: Question[],
    answers: Record<string, any>,
  ): Promise<string[]> {
    const startTime = Date.now();
    const telemetry = getTelemetry();
    
    telemetry.info('FindingsToQuestionsAgent: Starting AC refinement', {
      agent: 'FindingsToQuestionsAgent',
      answeredQuestionsCount: Object.keys(answers).length,
      currentACCount: acceptanceCriteria.length,
    });

    const llm = this.llmConfig.getDefaultLLM();

    const qaText = questions
      .map((q) => {
        const answer = answers[q.id];
        return `Q: ${q.text}\nA: ${this.formatAnswer(answer, q.type)}`;
      })
      .join('\n\n');

    const prompt = `Refine these acceptance criteria based on user answers:

CURRENT ACCEPTANCE CRITERIA:
${acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

USER ANSWERS:
${qaText}

Generate improved acceptance criteria that incorporate the user's answers.
Make criteria more specific and testable.

Respond with JSON:
{
  "acceptanceCriteria": [
    "AC #1: Specific, testable condition",
    "AC #2: Another condition"
  ]
}`;

    try {
      const response = await llm.generate(prompt);
      const duration = Date.now() - startTime;
      
      // Record LLM call
      telemetry.recordLLMCall(
        'mastra-default-llm',
        'Refine AC based on answers',
        response.substring(0, 150),
        {
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: Math.ceil(response.length / 4),
          totalTokens: Math.ceil((prompt.length + response.length) / 4),
          duration,
          success: true,
        }
      );

      const parsed = JSON.parse(response);

      const refined = Array.isArray(parsed.acceptanceCriteria)
        ? parsed.acceptanceCriteria
        : acceptanceCriteria;

      telemetry.info('FindingsToQuestionsAgent: AC refinement completed', {
        agent: 'FindingsToQuestionsAgent',
        refinedACCount: refined.length,
        duration,
      });

      return refined;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[FindingsToQuestionsAgent] Failed to refine AC:', error);
      
      telemetry.error('FindingsToQuestionsAgent: AC refinement failed', error as Error, {
        agent: 'FindingsToQuestionsAgent',
        duration,
      });

      // Fallback: Return original AC
      return acceptanceCriteria;
    }
  }

  /**
   * Format answer for display in prompt
   */
  private formatAnswer(answer: any, type: string): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    if (typeof answer === 'boolean') {
      return answer ? 'Yes' : 'No';
    }
    return String(answer || '(Not answered)');
  }

  /**
   * Generate code-aware clarifying questions based on acceptance criteria
   */
  private generateCodeAwareQuestions(acceptanceCriteria: string[]): Question[] {
    const questions: Question[] = [];

    // Question 1: Architecture/Integration
    if (acceptanceCriteria.some(ac => 
      ac.toLowerCase().includes('database') || 
      ac.toLowerCase().includes('api') ||
      ac.toLowerCase().includes('service')
    )) {
      questions.push({
        id: 'arch-1',
        text: 'Which existing service/module should this integrate with?',
        type: 'radio',
        options: ['Authentication', 'Database', 'API Gateway', 'Cache', 'Message Queue', 'Other'],
      });
    }

    // Question 2: Technology choice
    if (acceptanceCriteria.some(ac => 
      ac.toLowerCase().includes('framework') || 
      ac.toLowerCase().includes('library') ||
      ac.toLowerCase().includes('tool')
    )) {
      questions.push({
        id: 'tech-1',
        text: 'Should this use existing dependencies or add new ones?',
        type: 'radio',
        options: ['Use existing', 'Add new dependency', 'Build from scratch', 'No preference'],
      });
    }

    // Question 3: Performance/Data volume
    if (acceptanceCriteria.some(ac => 
      ac.toLowerCase().includes('performance') || 
      ac.toLowerCase().includes('scale') ||
      ac.toLowerCase().includes('large') ||
      ac.toLowerCase().includes('many')
    )) {
      questions.push({
        id: 'perf-1',
        text: 'What data volume should this handle?',
        type: 'radio',
        options: ['< 100 records', '100K - 1M', '1M - 100M', '> 100M', 'Unknown'],
      });
    }

    // Question 4: Security/Auth
    if (acceptanceCriteria.some(ac => 
      ac.toLowerCase().includes('auth') || 
      ac.toLowerCase().includes('permission') ||
      ac.toLowerCase().includes('security') ||
      ac.toLowerCase().includes('user')
    )) {
      questions.push({
        id: 'sec-1',
        text: 'What authorization level is required?',
        type: 'radio',
        options: ['Public', 'Authenticated users', 'Specific roles', 'Admin only'],
      });
    }

    // Question 5: Testing requirement (always ask)
    questions.push({
      id: 'test-1',
      text: 'What testing level do you need?',
      type: 'radio',
      options: ['Unit tests only', 'Unit + Integration', 'Full E2E', 'Minimal testing'],
    });

    if (questions.length === 0) {
      // Fallback if no specific questions matched
      questions.push({
        id: 'custom-1',
        text: 'Any specific technical considerations?',
        type: 'textarea',
      });
    }

    return questions;
  }

  /**
   * Generate default clarifying questions when AC is minimal
   */
  private generateDefaultQuestions(acceptanceCriteria: string[]): Question[] {
    // Use code-aware questions based on AC content
    return this.generateCodeAwareQuestions(acceptanceCriteria);
  }
}
