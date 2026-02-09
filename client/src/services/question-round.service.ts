import axios, { AxiosInstance } from 'axios';
import { auth } from '@/lib/firebase';
import type {
  StartQuestionRoundRequest,
  StartQuestionRoundResponse,
  SubmitAnswersRequest,
  SubmitAnswersResponse,
  FinalizeSpecRequest,
  FinalizeSpecResponse,
  QuestionRound,
  TechSpec,
  ClarificationQuestion,
  RoundAnswers,
} from '@/types/question-refinement';

/**
 * Service for question refinement workflow
 * Simplified single-set flow:
 * - Generate up to 5 clarification questions
 * - Submit answers and finalize spec
 *
 * Legacy support:
 * - Old round-based endpoints (kept for backward compatibility)
 */
export class QuestionRoundService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    if (!baseURL) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    });

    // Add Firebase ID token to all requests
    this.client.interceptors.request.use(async (config) => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Generate clarification questions (simplified single-call flow)
   * Up to 5 questions based on codebase context
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
   * Submit question answers and finalize spec
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

  /**
   * LEGACY: Start a new question round (deprecated, use generateQuestions)
   * Generates context-aware questions based on codebase and prior answers
   */
  async startRound(
    ticketId: string,
    roundNumber: 1 | 2 | 3,
    priorAnswers?: RoundAnswers
  ): Promise<StartQuestionRoundResponse> {
    try {
      const response = await this.client.post<StartQuestionRoundResponse>(
        `/tickets/${ticketId}/start-round`,
        {
          roundNumber,
          priorAnswers,
        } as StartQuestionRoundRequest
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(`Failed to start round ${roundNumber}`);
    }
  }

  /**
   * LEGACY: Submit answers for current round (deprecated)
   * Backend decides: continue to next round or finalize
   */
  async submitAnswers(
    ticketId: string,
    roundNumber: 1 | 2 | 3,
    answers: RoundAnswers
  ): Promise<SubmitAnswersResponse> {
    try {
      const response = await this.client.post<SubmitAnswersResponse>(
        `/tickets/${ticketId}/submit-answers`,
        {
          roundNumber,
          answers,
        } as SubmitAnswersRequest
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to submit answers');
    }
  }

  /**
   * LEGACY: Skip remaining rounds and finalize immediately (deprecated)
   */
  async skipToFinalize(ticketId: string): Promise<void> {
    try {
      await this.client.post(`/tickets/${ticketId}/skip-to-finalize`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to skip to finalize');
    }
  }

  /**
   * Finalize spec with all accumulated answers
   */
  async finalizeSpec(ticketId: string, allAnswers: RoundAnswers[]): Promise<FinalizeSpecResponse> {
    try {
      const response = await this.client.post<FinalizeSpecResponse>(
        `/tickets/${ticketId}/finalize`,
        {
          allAnswers,
        } as FinalizeSpecRequest
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to finalize spec');
    }
  }
}
