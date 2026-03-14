import { AxiosInstance } from 'axios';
import { createApiClient } from '@/lib/api-client';
import type {
  ClarificationQuestion,
  TechSpec,
} from '@/types/question-refinement';

/**
 * Service for question refinement workflow (simplified flow)
 * - Generate up to 5 clarification questions
 * - Submit answers and finalize spec
 */
export class QuestionRoundService {
  private client: AxiosInstance;

  constructor() {
    this.client = createApiClient();
    this.client.defaults.timeout = 120000;
  }

  /**
   * Generate clarification questions (up to 5)
   * Based on codebase context and prior analysis
   */
  async generateQuestions(ticketId: string): Promise<ClarificationQuestion[]> {
    try {
      const response = await this.client.post<{ questions: ClarificationQuestion[] }>(
        `/tickets/${ticketId}/generate-questions`
      );
      return response.data.questions;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to generate questions');
    }
  }

  /**
   * Submit question answers and finalize spec immediately
   */
  async submitQuestionAnswers(
    ticketId: string,
    answers: Record<string, string | string[]>
  ): Promise<TechSpec> {
    try {
      const response = await this.client.post<{ techSpec: TechSpec }>(
        `/tickets/${ticketId}/submit-answers`,
        { answers }
      );
      return response.data.techSpec;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to submit answers');
    }
  }
}
