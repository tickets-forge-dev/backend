import { Injectable, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';

/**
 * ExecuteWorkflowUseCase
 * 
 * Starts the ticket generation workflow for an AEC.
 * Uses Mastra workflow engine for execution.
 * 
 * Workflow steps:
 * 0. Initialize & Lock AEC
 * 1. Extract Intent
 * 2. Detect Type
 * 3. Preflight Validation
 * 4. Review Findings (suspension point)
 * 5. Gather Repo Context
 * 6. Gather API Context
 * 7. Draft Ticket
 * 8. Generate Questions
 * 9. Ask Questions (suspension point)
 * 10. Refine Draft
 * 11. Finalize & Unlock
 */

export interface ExecuteWorkflowInput {
  aecId: string;
  workspaceId: string;
}

export interface ExecuteWorkflowResult {
  success: boolean;
  message: string;
  workflowRunId?: string;
}

@Injectable()
export class ExecuteWorkflowUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(input: ExecuteWorkflowInput): Promise<ExecuteWorkflowResult> {
    console.log(`🚀 [ExecuteWorkflowUseCase] Starting workflow for AEC: ${input.aecId}`);

    // 1. Validate AEC exists and belongs to workspace
    const aec = await this.aecRepository.findById(input.aecId);
    if (!aec) {
      throw new Error(`AEC not found: ${input.aecId}`);
    }

    if (aec.workspaceId !== input.workspaceId) {
      throw new Error('AEC not found'); // Don't reveal workspace mismatch
    }

    // 2. Check if AEC is already locked (concurrent workflow prevention)
    if (aec.isLocked) {
      throw new Error(`AEC is already being processed by workflow: ${aec.lockedBy}`);
    }

    // 3. Validate AEC is in a state that allows workflow execution
    if (aec.status !== 'draft') {
      throw new Error(`Cannot start workflow for AEC in status: ${aec.status}. AEC must be in draft status.`);
    }

    // 4. Generate workflow run ID
    const workflowRunId = `workflow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // 5. Start the workflow (this will be handled by Mastra)
    // For now, we simulate by updating AEC state directly
    // In production, this would call ticketGenerationWorkflow.execute()
    
    try {
      // Lock AEC and transition to GENERATING
      aec.startGenerating(workflowRunId);
      
      // Initialize generation state
      aec.updateGenerationState({
        currentStep: 1,
        steps: [
          { id: 1, title: 'Extracting Intent', status: 'in-progress' },
          { id: 2, title: 'Detecting Type', status: 'pending' },
          { id: 3, title: 'Running Preflight Validation', status: 'pending' },
          { id: 4, title: 'Reviewing Findings', status: 'pending' },
          { id: 5, title: 'Gathering Repository Context', status: 'pending' },
          { id: 6, title: 'Gathering API Context', status: 'pending' },
          { id: 7, title: 'Drafting Ticket', status: 'pending' },
          { id: 8, title: 'Generating Questions', status: 'pending' },
        ],
      });

      await this.aecRepository.update(aec);

      console.log(`✅ [ExecuteWorkflowUseCase] Workflow started: ${workflowRunId}`);

      // TODO: Actually trigger Mastra workflow execution here
      // const mastraClient = this.mastraService.getClient();
      // await mastraClient.workflows.execute('ticket-generation', {
      //   aecId: input.aecId,
      //   workspaceId: input.workspaceId,
      // });

      return {
        success: true,
        message: 'Workflow started successfully',
        workflowRunId,
      };
    } catch (error: any) {
      console.error(`❌ [ExecuteWorkflowUseCase] Failed to start workflow:`, error);

      // Attempt to unlock if we locked but failed
      try {
        if (aec.isLocked) {
          aec.forceUnlock();
          await this.aecRepository.update(aec);
        }
      } catch (unlockError) {
        console.error(`❌ [ExecuteWorkflowUseCase] Failed to unlock after error:`, unlockError);
      }

      throw error;
    }
  }
}
