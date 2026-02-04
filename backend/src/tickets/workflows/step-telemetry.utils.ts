/**
 * Step Telemetry Utilities
 *
 * Provides standardized telemetry tracking for all workflow steps:
 * - Basic step tracking (start, complete, fail)
 * - LLM metrics collection (tokens, duration, model, temperature)
 * - Call tracking (LLM calls per step)
 * - Agent tracing (which agents were used)
 *
 * Usage:
 * ```typescript
 * const tracker = new StepTelemetryTracker('extractIntent', 'Extract Intent');
 * 
 * tracker.startStep({ aecId, intent: '...' });
 *
 * // Track an LLM call
 * const llmTracker = tracker.startLLMCall('mastra', { model: 'qwen2.5', temp: 0.3 });
 * // ... make LLM call
 * llmTracker.complete(45, 78);  // promptTokens, completionTokens
 *
 * tracker.completeStep({ outputSize: 512 });
 * ```
 */

import { getTelemetry } from '../application/services/WorkflowTelemetry';

export interface StepMetadata {
  aecId?: string;
  workflowRunId?: string;
  intent?: string;
  type?: string;
  findings?: number;
  [key: string]: any;
}

export interface LLMCallMetadata {
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  [key: string]: any;
}

export interface LLMCallResult {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  duration: number;
}

/**
 * Tracks telemetry for a single workflow step
 */
export class StepTelemetryTracker {
  private stepId: string;
  private stepName: string;
  private startTime: number;
  private telemetry = getTelemetry();
  private llmCalls: Array<{
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    duration: number;
  }> = [];

  constructor(stepId: string, stepName: string) {
    this.stepId = stepId;
    this.stepName = stepName;
    this.startTime = Date.now();
  }

  /**
   * Record step start
   */
  startStep(metadata: StepMetadata): void {
    this.telemetry.startStep(this.stepId, this.stepName, metadata.workflowRunId || '');
    
    this.telemetry.info(`Step ${this.stepId} [${this.stepName}] started`, {
      step: this.stepId,
      stepName: this.stepName,
      ...metadata,
    });
  }

  /**
   * Start tracking an LLM call
   */
  startLLMCall(agent: string, metadata: LLMCallMetadata): LLMCallTracker {
    const llmStartTime = Date.now();
    
    return {
      complete: (promptTokens: number, completionTokens: number, duration?: number) => {
        const actualDuration = duration || (Date.now() - llmStartTime);
        const totalTokens = promptTokens + completionTokens;

        // Track in our list
        this.llmCalls.push({
          model: metadata.model,
          promptTokens,
          completionTokens,
          totalTokens,
          duration: actualDuration,
        });

        // Record to telemetry
        this.telemetry.recordLLMCall(
          metadata.model,
          `[${this.stepName}] LLM call`,
          'Response received',
          {
            promptTokens,
            completionTokens,
            totalTokens,
            duration: actualDuration,
            temperature: metadata.temperature,
            topP: metadata.topP,
            maxTokens: metadata.maxTokens,
            success: true,
          }
        );

        this.telemetry.info(`Step ${this.stepId}: LLM call completed`, {
          step: this.stepId,
          stepName: this.stepName,
          agent,
          model: metadata.model,
          promptTokens,
          completionTokens,
          totalTokens,
          duration: actualDuration,
          temperature: metadata.temperature,
        });
      },
      
      error: (error: Error, metrics?: Partial<LLMCallResult>) => {
        const actualDuration = metrics?.duration || (Date.now() - llmStartTime);

        this.telemetry.recordLLMError(
          metadata.model,
          error,
          {
            step: this.stepId,
            stepName: this.stepName,
            agent,
            duration: actualDuration,
            temperature: metadata.temperature,
          }
        );

        this.telemetry.error(`Step ${this.stepId}: LLM call failed`, error, {
          step: this.stepId,
          stepName: this.stepName,
          agent,
          model: metadata.model,
          duration: actualDuration,
        });
      },
    };
  }

  /**
   * Track an agent call
   */
  recordAgentCall(agentName: string, toolName: string, result: 'success' | 'error', duration: number, metadata?: any): void {
    this.telemetry.info(`Step ${this.stepId}: Agent tool call`, {
      step: this.stepId,
      stepName: this.stepName,
      agent: agentName,
      tool: toolName,
      result,
      duration,
      ...metadata,
    });
  }

  /**
   * Record step completion
   */
  completeStep(outputMetadata: {
    outputSize?: number;
    outputTokens?: number;
    details?: string;
    status?: string;
    [key: string]: any;
  }): void {
    const totalDuration = Date.now() - this.startTime;
    const totalLLMTokens = this.llmCalls.reduce((sum, call) => sum + call.totalTokens, 0);
    const totalLLMDuration = this.llmCalls.reduce((sum, call) => sum + call.duration, 0);
    const llmCallCount = this.llmCalls.length;

    this.telemetry.completeStep(
      this.stepId,
      totalDuration,
      outputMetadata.outputSize || outputMetadata.outputTokens || 0
    );

    this.telemetry.info(`Step ${this.stepId} [${this.stepName}] completed`, {
      step: this.stepId,
      stepName: this.stepName,
      duration: totalDuration,
      llmCallCount,
      totalLLMTokens,
      totalLLMDuration,
      llmCalls: this.llmCalls.map(call => ({
        model: call.model,
        tokens: call.totalTokens,
        duration: call.duration,
      })),
      ...outputMetadata,
    });
  }

  /**
   * Record step error
   */
  errorStep(error: Error, metadata?: any): void {
    const totalDuration = Date.now() - this.startTime;

    this.telemetry.stepError(this.stepId, error, {
      step: this.stepId,
      stepName: this.stepName,
      duration: totalDuration,
      llmCallCount: this.llmCalls.length,
      ...metadata,
    });

    this.telemetry.error(`Step ${this.stepId} [${this.stepName}] failed`, error, {
      step: this.stepId,
      stepName: this.stepName,
      duration: totalDuration,
    });
  }

  /**
   * Get summary of all LLM calls in this step
   */
  getLLMSummary(): {
    callCount: number;
    totalTokens: number;
    totalDuration: number;
    calls: any[];
  } {
    return {
      callCount: this.llmCalls.length,
      totalTokens: this.llmCalls.reduce((sum, call) => sum + call.totalTokens, 0),
      totalDuration: this.llmCalls.reduce((sum, call) => sum + call.duration, 0),
      calls: this.llmCalls,
    };
  }
}

/**
 * Returned by startLLMCall() to track individual LLM call completion
 */
export interface LLMCallTracker {
  complete(promptTokens: number, completionTokens: number, duration?: number): void;
  error(error: Error, metrics?: Partial<LLMCallResult>): void;
}

/**
 * Factory to create step trackers with consistent naming
 */
export class WorkflowTelemetryFactory {
  static createStepTracker(stepId: string, stepName: string): StepTelemetryTracker {
    return new StepTelemetryTracker(stepId, stepName);
  }

  /**
   * Get all step trackers for the workflow
   */
  static getAllStepTrackers() {
    return {
      initializeAndLock: new StepTelemetryTracker('0', 'Initialize and Lock'),
      extractIntent: new StepTelemetryTracker('1', 'Extract Intent'),
      detectType: new StepTelemetryTracker('2', 'Detect Type'),
      preflightValidation: new StepTelemetryTracker('3', 'Preflight Validation'),
      reviewFindings: new StepTelemetryTracker('4', 'Review Findings'),
      gatherRepoContext: new StepTelemetryTracker('5', 'Gather Repository Context'),
      gatherAPIContext: new StepTelemetryTracker('6', 'Gather API Context'),
      generateAcceptanceCriteria: new StepTelemetryTracker('7', 'Generate Acceptance Criteria'),
      generateQuestions: new StepTelemetryTracker('8', 'Generate Questions'),
      askQuestions: new StepTelemetryTracker('9', 'Ask Questions'),
      refineDraft: new StepTelemetryTracker('10', 'Refine Draft'),
      finalizeTicket: new StepTelemetryTracker('11', 'Finalize Ticket'),
      unlock: new StepTelemetryTracker('12', 'Unlock'),
    };
  }
}
