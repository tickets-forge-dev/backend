/**
 * Workflow Telemetry Service
 * 
 * Provides structured logging and timing for workflow execution.
 * Helps debug and understand agent behavior.
 */

import { Injectable } from '@nestjs/common';

export interface StepTelemetry {
  stepId: string;
  stepName: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: 'started' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  llmCalls?: LLMCallTelemetry[];
}

export interface LLMCallTelemetry {
  model: string;
  promptLength: number;
  responseLength?: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface WorkflowTelemetry {
  workflowId: string;
  aecId: string;
  startTime: number;
  endTime?: number;
  steps: StepTelemetry[];
  totalLLMCalls: number;
  totalLLMDurationMs: number;
}

@Injectable()
export class WorkflowTelemetryService {
  private currentWorkflow: WorkflowTelemetry | null = null;
  private currentStep: StepTelemetry | null = null;

  /**
   * Start tracking a new workflow
   */
  startWorkflow(workflowId: string, aecId: string): void {
    this.currentWorkflow = {
      workflowId,
      aecId,
      startTime: Date.now(),
      steps: [],
      totalLLMCalls: 0,
      totalLLMDurationMs: 0,
    };
    console.log(`\n📊 ═══════════════════════════════════════════════════════`);
    console.log(`📊 WORKFLOW STARTED: ${workflowId}`);
    console.log(`📊 AEC: ${aecId}`);
    console.log(`📊 ═══════════════════════════════════════════════════════\n`);
  }

  /**
   * Start tracking a step
   */
  startStep(stepId: string, stepName: string, input?: any): void {
    this.currentStep = {
      stepId,
      stepName,
      startTime: Date.now(),
      status: 'started',
      input: input ? this.truncate(JSON.stringify(input), 200) : undefined,
      llmCalls: [],
    };
    console.log(`\n🔹 STEP ${stepId}: ${stepName}`);
    console.log(`   Started at: ${new Date().toISOString()}`);
    if (input) {
      console.log(`   Input: ${this.truncate(JSON.stringify(input), 100)}`);
    }
  }

  /**
   * Record an LLM call
   */
  recordLLMCall(model: string, promptLength: number, responseLength: number, durationMs: number, success: boolean, error?: string): void {
    const call: LLMCallTelemetry = {
      model,
      promptLength,
      responseLength,
      durationMs,
      success,
      error,
    };

    if (this.currentStep) {
      this.currentStep.llmCalls = this.currentStep.llmCalls || [];
      this.currentStep.llmCalls.push(call);
    }

    if (this.currentWorkflow) {
      this.currentWorkflow.totalLLMCalls++;
      this.currentWorkflow.totalLLMDurationMs += durationMs;
    }

    const status = success ? '✅' : '❌';
    console.log(`   🤖 LLM Call: ${model}`);
    console.log(`      ${status} Prompt: ${promptLength} chars → Response: ${responseLength || 0} chars (${durationMs}ms)`);
    if (error) {
      console.log(`      Error: ${error}`);
    }
  }

  /**
   * Complete a step
   */
  completeStep(output?: any, error?: string): void {
    if (!this.currentStep) return;

    this.currentStep.endTime = Date.now();
    this.currentStep.durationMs = this.currentStep.endTime - this.currentStep.startTime;
    this.currentStep.status = error ? 'failed' : 'completed';
    this.currentStep.output = output ? this.truncate(JSON.stringify(output), 200) : undefined;
    this.currentStep.error = error;

    if (this.currentWorkflow) {
      this.currentWorkflow.steps.push({ ...this.currentStep });
    }

    const status = error ? '❌ FAILED' : '✅ COMPLETED';
    console.log(`   ${status} (${this.currentStep.durationMs}ms)`);
    if (output) {
      console.log(`   Output: ${this.truncate(JSON.stringify(output), 100)}`);
    }
    if (error) {
      console.log(`   Error: ${error}`);
    }

    this.currentStep = null;
  }

  /**
   * Complete the workflow
   */
  completeWorkflow(success: boolean): void {
    if (!this.currentWorkflow) return;

    this.currentWorkflow.endTime = Date.now();
    const totalDuration = this.currentWorkflow.endTime - this.currentWorkflow.startTime;

    console.log(`\n📊 ═══════════════════════════════════════════════════════`);
    console.log(`📊 WORKFLOW ${success ? 'COMPLETED ✅' : 'FAILED ❌'}`);
    console.log(`📊 Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
    console.log(`📊 Steps Completed: ${this.currentWorkflow.steps.filter(s => s.status === 'completed').length}/${this.currentWorkflow.steps.length}`);
    console.log(`📊 LLM Calls: ${this.currentWorkflow.totalLLMCalls} (${this.currentWorkflow.totalLLMDurationMs}ms total)`);
    console.log(`📊 ═══════════════════════════════════════════════════════\n`);

    // Log step summary
    console.log(`📊 STEP SUMMARY:`);
    for (const step of this.currentWorkflow.steps) {
      const status = step.status === 'completed' ? '✅' : '❌';
      const llmInfo = step.llmCalls?.length ? ` (${step.llmCalls.length} LLM calls)` : '';
      console.log(`   ${status} ${step.stepId}: ${step.stepName} - ${step.durationMs}ms${llmInfo}`);
    }
    console.log('');

    this.currentWorkflow = null;
  }

  /**
   * Get current workflow telemetry
   */
  getCurrentTelemetry(): WorkflowTelemetry | null {
    return this.currentWorkflow;
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + '...';
  }
}

// Singleton instance for use outside DI
let telemetryInstance: WorkflowTelemetryService | null = null;

export function getTelemetry(): WorkflowTelemetryService {
  if (!telemetryInstance) {
    telemetryInstance = new WorkflowTelemetryService();
  }
  return telemetryInstance;
}
