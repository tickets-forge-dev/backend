/**
 * MastraService - NestJS Service for Mastra Workflow Integration
 *
 * Provides a singleton Mastra instance with:
 * - Registered workflows (ticket-generation)
 * - Service injection for workflow steps
 * - Workflow execution and resume methods
 *
 * Story 7.10: HITL Workflow Integration
 */

import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Mastra } from '@mastra/core';
import { ticketGenerationWorkflow } from '../../../tickets/workflows/ticket-generation.workflow';
import type { TicketGenerationInput } from '../../../tickets/workflows/ticket-generation.workflow';

// Service injection tokens
export const MASTRA_SERVICES = {
  AECRepository: 'AECRepository',
  MastraContentGenerator: 'MastraContentGenerator',
  IndexQueryService: 'IndexQueryService',
  MastraWorkspaceFactory: 'MastraWorkspaceFactory',
  QuickPreflightValidator: 'QuickPreflightValidator',
  FindingsToQuestionsAgent: 'FindingsToQuestionsAgent',
} as const;

export interface WorkflowExecutionResult {
  runId: string;
  status: 'success' | 'suspended' | 'failed';
  suspendedAt?: string;
  suspendPayload?: unknown;
  result?: unknown;
  error?: string;
}

export interface WorkflowResumeResult {
  status: 'success' | 'suspended' | 'failed';
  suspendedAt?: string;
  suspendPayload?: unknown;
  result?: unknown;
  error?: string;
}

@Injectable()
export class MastraService implements OnModuleInit {
  private mastra: Mastra | null = null;
  private services: Map<string, unknown> = new Map();

  constructor(
    @Inject(forwardRef(() => 'AECRepository'))
    private readonly aecRepository: unknown,
    @Inject(forwardRef(() => 'MastraContentGenerator'))
    private readonly contentGenerator: unknown,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  /**
   * Initialize Mastra instance with workflows and services
   */
  async initialize(): Promise<void> {
    // Register services that workflow steps can access via mastra.getService()
    this.services.set(MASTRA_SERVICES.AECRepository, this.aecRepository);
    this.services.set(MASTRA_SERVICES.MastraContentGenerator, this.contentGenerator);

    // Create Mastra instance with workflows
    this.mastra = new Mastra({
      workflows: {
        'ticket-generation': ticketGenerationWorkflow,
      },
    });

    // Override getService to return our registered services
    const originalGetService = this.mastra.getService?.bind(this.mastra);
    (this.mastra as any).getService = (serviceName: string) => {
      const service = this.services.get(serviceName);
      if (service) {
        return service;
      }
      return originalGetService?.(serviceName);
    };

    console.log('✅ [MastraService] Initialized with ticket-generation workflow');
  }

  /**
   * Register a service for workflow steps to access
   */
  registerService(name: string, service: unknown): void {
    this.services.set(name, service);
    console.log(`✅ [MastraService] Registered service: ${name}`);
  }

  /**
   * Get the Mastra instance
   */
  getMastra(): Mastra {
    if (!this.mastra) {
      throw new Error('MastraService not initialized');
    }
    return this.mastra;
  }

  /**
   * Execute the ticket generation workflow
   */
  async executeTicketGeneration(
    input: TicketGenerationInput
  ): Promise<WorkflowExecutionResult> {
    if (!this.mastra) {
      throw new Error('MastraService not initialized');
    }

    try {
      const workflow = this.mastra.getWorkflow('ticket-generation');
      if (!workflow) {
        throw new Error('ticket-generation workflow not found');
      }

      const run = await workflow.createRun();
      const result = await run.start({ inputData: input });

      if (result.status === 'suspended') {
        // Find the suspended step info
        const suspendedStep = this.findSuspendedStep(result);
        return {
          runId: run.runId,
          status: 'suspended',
          suspendedAt: suspendedStep?.stepId,
          suspendPayload: suspendedStep?.payload,
        };
      }

      if (result.status === 'success') {
        return {
          runId: run.runId,
          status: 'success',
          result: result.result,
        };
      }

      return {
        runId: run.runId,
        status: 'failed',
        error: result.error?.message || 'Unknown error',
      };
    } catch (error: any) {
      console.error('[MastraService] Workflow execution failed:', error);
      return {
        runId: '',
        status: 'failed',
        error: error.message || 'Workflow execution failed',
      };
    }
  }

  /**
   * Resume a suspended workflow
   */
  async resumeWorkflow(
    runId: string,
    stepId: string,
    resumeData: unknown
  ): Promise<WorkflowResumeResult> {
    if (!this.mastra) {
      throw new Error('MastraService not initialized');
    }

    try {
      const workflow = this.mastra.getWorkflow('ticket-generation');
      if (!workflow) {
        throw new Error('ticket-generation workflow not found');
      }

      const run = await workflow.createRun({ runId });
      const result = await run.resume({
        step: stepId,
        resumeData,
      });

      if (result.status === 'suspended') {
        const suspendedStep = this.findSuspendedStep(result);
        return {
          status: 'suspended',
          suspendedAt: suspendedStep?.stepId,
          suspendPayload: suspendedStep?.payload,
        };
      }

      if (result.status === 'success') {
        return {
          status: 'success',
          result: result.result,
        };
      }

      return {
        status: 'failed',
        error: result.error?.message || 'Unknown error',
      };
    } catch (error: any) {
      console.error('[MastraService] Workflow resume failed:', error);
      return {
        status: 'failed',
        error: error.message || 'Workflow resume failed',
      };
    }
  }

  /**
   * Find suspended step information from workflow result
   */
  private findSuspendedStep(result: any): { stepId: string; payload: unknown } | null {
    // Look through the result context to find suspended step
    if (result.context) {
      for (const [stepId, stepData] of Object.entries(result.context)) {
        if (stepData && typeof stepData === 'object' && (stepData as any).status === 'suspended') {
          return {
            stepId,
            payload: (stepData as any).suspendPayload,
          };
        }
      }
    }
    return null;
  }
}
