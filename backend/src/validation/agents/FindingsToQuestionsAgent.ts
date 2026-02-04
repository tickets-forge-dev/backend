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
    const llm = this.llmConfig.getDefaultLLM();

    // Check if we should skip questions
    const shouldSkip = this.shouldSkipQuestions(input.findings, input.acceptanceCriteria);
    
    // If AC is minimal (< 3 items), always generate clarifying questions
    const needsClarification = input.acceptanceCriteria.length < 3;
    
    if (shouldSkip && !needsClarification) {
      console.log('[FindingsToQuestionsAgent] No questions needed - draft looks good');
      return [];
    }

    const prompt = this.buildPrompt(input);

    try {
      const response = await llm.generate(prompt);
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
        return this.generateDefaultQuestions(input.acceptanceCriteria);
      }

      // Validate and format questions
      const questions = this.validateQuestions(parsed.questions || []);

      if (questions.length === 0) {
        // LLM returned no valid questions, generate defaults
        return this.generateDefaultQuestions(input.acceptanceCriteria);
      }

      console.log(`[FindingsToQuestionsAgent] Generated ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('[FindingsToQuestionsAgent] Failed to generate questions:', error);
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
      const parsed = JSON.parse(response);

      return Array.isArray(parsed.acceptanceCriteria)
        ? parsed.acceptanceCriteria
        : acceptanceCriteria;
    } catch (error) {
      console.error('[FindingsToQuestionsAgent] Failed to refine AC:', error);
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
   * Generate default clarifying questions when AC is minimal
   */
  private generateDefaultQuestions(acceptanceCriteria: string[]): Question[] {
    const questions: Question[] = [];

    // Question 1: Scope clarification
    questions.push({
      id: 'scope-1',
      text: 'What is the primary user goal for this feature?',
      type: 'textarea',
      context: 'Help us understand the main use case to generate better acceptance criteria.',
    });

    // Question 2: Success criteria
    questions.push({
      id: 'success-1',
      text: 'How will you know this feature is working correctly?',
      type: 'textarea',
      context: 'Describe the expected behavior or outcome that indicates success.',
    });

    // Question 3: Edge cases
    questions.push({
      id: 'edge-1',
      text: 'Are there any edge cases or error scenarios we should handle?',
      type: 'textarea',
      context: 'Consider invalid inputs, network failures, or unusual user behavior.',
    });

    console.log(`[FindingsToQuestionsAgent] Generated ${questions.length} default questions (minimal AC detected)`);
    return questions;
  }
}
