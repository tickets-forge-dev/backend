/**
 * Bulk Enrichment Types
 *
 * SSE event types and data structures for parallel ticket enrichment and finalization.
 */

/**
 * Enrichment phase
 */
export type EnrichmentPhase = 'deep_analysis' | 'question_generation' | 'complete' | 'error';

/**
 * Finalization phase
 */
export type FinalizationPhase = 'generating_spec' | 'saving' | 'complete' | 'error';

/**
 * Status of enrichment/finalization
 */
export type ProcessingStatus = 'started' | 'in_progress' | 'completed' | 'failed';

/**
 * Event type
 */
export type EventType = 'progress' | 'complete' | 'error';

/**
 * Enrichment progress event
 *
 * Emitted via SSE during parallel enrichment phase
 */
export interface EnrichmentProgressEvent {
  type: 'progress' | 'complete' | 'error';
  ticketId: string;
  ticketTitle: string;
  agentId: number; // 1, 2, or 3
  phase: EnrichmentPhase;
  status: ProcessingStatus;
  message: string;
  metadata?: {
    currentStep?: string;
    questionCount?: number;
    error?: string;
  };
}

/**
 * Finalization progress event
 *
 * Emitted via SSE during parallel finalization phase
 */
export interface FinalizationProgressEvent {
  type: 'progress' | 'complete' | 'error';
  ticketId: string;
  ticketTitle: string;
  agentId: number; // 1, 2, or 3
  phase: FinalizationPhase;
  status: ProcessingStatus;
  message: string;
  metadata?: {
    currentStep?: string;
    error?: string;
  };
}

/**
 * Enriched question for frontend
 */
export interface EnrichedQuestion {
  id: string;
  text: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea' | 'select';
  options?: string[];
  required: boolean;
}

/**
 * Question answer from user
 */
export interface QuestionAnswer {
  ticketId: string;
  questionId: string;
  answer: string;
}

/**
 * Final enrichment completion event
 *
 * Sent as final SSE event after all enrichments complete
 */
export interface EnrichmentCompleteEvent {
  type: 'complete';
  questions: Record<string, EnrichedQuestion[]>; // Map of ticketId -> questions
  errors: Record<string, string>; // Map of ticketId -> error message
  completedCount: number;
  failedCount: number;
}

/**
 * Final finalization completion event
 *
 * Sent as final SSE event after all fina lizations complete
 */
export interface FinalizationCompleteEvent {
  type: 'complete';
  results: Array<{
    ticketId: string;
    ticketTitle: string;
    success: boolean;
    error?: string;
  }>;
  completedCount: number;
  failedCount: number;
}
