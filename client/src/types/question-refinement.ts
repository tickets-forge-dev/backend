/**
 * Frontend-only types for question refinement workflow
 * These types mirror backend domain models but are defined in frontend
 * to maintain clean architecture separation.
 *
 * DO NOT import from backend domain code.
 */

/**
 * Question input type - determines how the question is displayed to user
 */
export type QuestionInputType = 'radio' | 'checkbox' | 'text' | 'multiline' | 'select';

/**
 * Clarification question - asked during refinement rounds
 */
export interface ClarificationQuestion {
  id: string;
  question: string;
  type: QuestionInputType;
  options?: string[]; // For radio/checkbox/select
  context?: string; // Why is this question being asked
  impact?: string; // How does the answer affect the spec
}

/**
 * Answer to a clarification question
 */
export type QuestionAnswer = string | string[] | null;

/**
 * User answers map for a round
 */
export interface RoundAnswers {
  [questionId: string]: QuestionAnswer;
}

/**
 * Single question round (1-3)
 */
export interface QuestionRound {
  roundNumber: 1 | 2 | 3;
  questions: ClarificationQuestion[];
  answers: RoundAnswers;
  startedAt: Date;
  answeredAt: Date | null;
  skippedByUser: boolean;
  codebaseContext?: string; // JSON string of context used for this round
}

/**
 * Technical specification generated from questions
 */
export interface TechSpec {
  problemStatement: string;
  solution: string[]; // Step-by-step solution
  acceptanceCriteria: string[];
  fileChanges: Array<{
    path: string;
    type: 'create' | 'modify' | 'delete';
  }>;
  qualityScore: number; // 0-100
  generatedAt: Date;
}

/**
 * API request to start a question round
 */
export interface StartQuestionRoundRequest {
  roundNumber: 1 | 2 | 3;
  priorAnswers?: RoundAnswers; // Answers from previous rounds
}

/**
 * API response from starting a round
 */
export interface StartQuestionRoundResponse {
  roundNumber: 1 | 2 | 3;
  questions: ClarificationQuestion[];
  codebaseContext: string;
}

/**
 * API request to submit answers
 */
export interface SubmitAnswersRequest {
  roundNumber: 1 | 2 | 3;
  answers: RoundAnswers;
}

/**
 * API response from submitting answers
 */
export interface SubmitAnswersResponse {
  nextAction: 'continue' | 'finalize';
  nextRound?: {
    roundNumber: 1 | 2 | 3;
    questions: ClarificationQuestion[];
  };
}

/**
 * API request to finalize spec
 */
export interface FinalizeSpecRequest {
  allAnswers: RoundAnswers[]; // Answers from all rounds
}

/**
 * API response from finalizing spec
 */
export interface FinalizeSpecResponse {
  techSpec: TechSpec;
}
