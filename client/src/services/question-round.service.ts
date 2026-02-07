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
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
    console.log(`❓ [QuestionRoundService] Generating questions for ticket ${ticketId}`);

    try {
      const response = await this.client.post<{ questions: ClarificationQuestion[] }>(
        `/tickets/${ticketId}/generate-questions`
      );
      console.log(`❓ [QuestionRoundService] Questions generated`, {
        questionCount: response.data.questions.length,
      });
      return response.data.questions;
    } catch (error: any) {
      console.error(
        `❌ [QuestionRoundService] Failed to generate questions:`,
        error.response?.data || error.message
      );
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
    console.log(`✅ [QuestionRoundService] Submitting question answers for ticket ${ticketId}`);

    try {
      const response = await this.client.post<{ techSpec: TechSpec }>(
        `/tickets/${ticketId}/submit-answers`,
        { answers }
      );
      console.log(`✅ [QuestionRoundService] Answers submitted and spec finalized`, {
        qualityScore: response.data.techSpec.qualityScore,
      });
      return response.data.techSpec;
    } catch (error: any) {
      console.error(
        `❌ [QuestionRoundService] Failed to submit answers:`,
        error.response?.data || error.message
      );
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
    console.log(`📋 [QuestionRoundService] Starting round ${roundNumber} for ticket ${ticketId}`);

    try {
      const response = await this.client.post<StartQuestionRoundResponse>(
        `/tickets/${ticketId}/start-round`,
        {
          roundNumber,
          priorAnswers,
        } as StartQuestionRoundRequest
      );
      console.log(`📋 [QuestionRoundService] Round ${roundNumber} started`, {
        questionCount: response.data.questions.length,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `❌ [QuestionRoundService] Failed to start round:`,
        error.response?.data || error.message
      );
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
    console.log(`📤 [QuestionRoundService] LEGACY: Submitting answers for round ${roundNumber}`);

    try {
      const response = await this.client.post<SubmitAnswersResponse>(
        `/tickets/${ticketId}/submit-answers`,
        {
          roundNumber,
          answers,
        } as SubmitAnswersRequest
      );
      console.log(`📤 [QuestionRoundService] Answers submitted`, {
        nextAction: response.data.nextAction,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `❌ [QuestionRoundService] Failed to submit answers:`,
        error.response?.data || error.message
      );
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
    console.log(`⏭️ [QuestionRoundService] LEGACY: Skipping to finalize for ticket ${ticketId}`);

    try {
      await this.client.post(`/tickets/${ticketId}/skip-to-finalize`);
      console.log(`⏭️ [QuestionRoundService] Finalization initiated`);
    } catch (error: any) {
      console.error(
        `❌ [QuestionRoundService] Failed to skip:`,
        error.response?.data || error.message
      );
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
    console.log(`✨ [QuestionRoundService] Finalizing spec for ticket ${ticketId}`);

    try {
      const response = await this.client.post<FinalizeSpecResponse>(
        `/tickets/${ticketId}/finalize`,
        {
          allAnswers,
        } as FinalizeSpecRequest
      );
      console.log(`✨ [QuestionRoundService] Spec finalized`, {
        qualityScore: response.data.techSpec.qualityScore,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `❌ [QuestionRoundService] Failed to finalize:`,
        error.response?.data || error.message
      );
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to finalize spec');
    }
  }
}
