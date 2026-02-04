import { Injectable, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { MastraService } from '../../../shared/infrastructure/mastra/mastra.service';

// Feature flag to switch between GenerationOrchestrator (legacy) and MastraService (HITL workflow)
const USE_MASTRA_WORKFLOW = process.env.USE_MASTRA_WORKFLOW === 'true';

/**
 * ResumeWorkflowUseCase
 * 
 * Handles workflow resumption from suspension points:
 * - Findings review (proceed, edit, cancel)
 * - Questions submission
 * - Questions skip
 * 
 * When USE_MASTRA_WORKFLOW=true, also resumes the actual Mastra workflow execution.
 */

export interface ResumeFindingsInput {
  aecId: string;
  workspaceId: string;
  action: 'proceed' | 'edit' | 'cancel';
}

export interface SubmitAnswersInput {
  aecId: string;
  workspaceId: string;
  answers: Record<string, string>;
}

export interface SkipQuestionsInput {
  aecId: string;
  workspaceId: string;
}

export interface ResumeWorkflowResult {
  success: boolean;
  message: string;
}

@Injectable()
export class ResumeWorkflowUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly mastraService: MastraService,
  ) {}

  /**
   * Resume workflow from findings review suspension point
   */
  async resumeFromFindings(input: ResumeFindingsInput): Promise<ResumeWorkflowResult> {
    console.log(`⏸️ [ResumeWorkflowUseCase] Resuming from findings: ${input.action}`);

    const aec = await this.aecRepository.findById(input.aecId);
    if (!aec) {
      throw new Error(`AEC not found: ${input.aecId}`);
    }

    if (aec.workspaceId !== input.workspaceId) {
      throw new Error('AEC not found');
    }

    // Validate AEC is in suspended-findings state
    if (aec.status !== 'suspended-findings') {
      throw new Error(`AEC is not in suspended-findings state. Current: ${aec.status}`);
    }

    switch (input.action) {
      case 'proceed':
        // Continue workflow from step 5 (gather repo context)
        aec.resumeGenerating();
        aec.updateGenerationState({
          currentStep: 5,
          steps: aec.generationState.steps.map((step: any) => {
            if (step.id === 4) {
              return { ...step, status: 'complete', details: 'User proceeded with findings' };
            }
            if (step.id === 5) {
              return { ...step, status: 'in-progress' };
            }
            return step;
          }),
        });
        break;

      case 'edit':
        // Revert to draft so user can edit
        aec.revertToDraft();
        aec.updateGenerationState({
          currentStep: 0,
          steps: [],
        });
        break;

      case 'cancel':
        // Mark as failed and unlock
        aec.markAsFailed('User cancelled workflow during findings review');
        break;

      default:
        throw new Error(`Invalid action: ${input.action}`);
    }

    await this.aecRepository.update(aec);

    // If using Mastra workflow and action is proceed, trigger actual workflow resume
    if (USE_MASTRA_WORKFLOW && input.action === 'proceed' && aec.lockedBy) {
      console.log(`🔄 [ResumeWorkflowUseCase] Resuming Mastra workflow from reviewFindings`);
      
      this.mastraService.resumeWorkflow(
        aec.lockedBy, // runId is stored as lockedBy
        'reviewFindings',
        { action: 'proceed' }
      ).then((result) => {
        console.log(`✅ [ResumeWorkflowUseCase] Mastra workflow resume result:`, result);
      }).catch((error) => {
        console.error(`❌ [ResumeWorkflowUseCase] Mastra workflow resume failed:`, error);
      });
    }

    console.log(`✅ [ResumeWorkflowUseCase] Resumed from findings: ${input.action}`);

    return {
      success: true,
      message: `Workflow ${input.action === 'proceed' ? 'continued' : input.action === 'edit' ? 'reverted to draft' : 'cancelled'}`,
    };
  }

  /**
   * Submit answers to questions and continue workflow
   */
  async submitAnswers(input: SubmitAnswersInput): Promise<ResumeWorkflowResult> {
    console.log(`📝 [ResumeWorkflowUseCase] Submitting answers`);

    const aec = await this.aecRepository.findById(input.aecId);
    if (!aec) {
      throw new Error(`AEC not found: ${input.aecId}`);
    }

    if (aec.workspaceId !== input.workspaceId) {
      throw new Error('AEC not found');
    }

    // Validate AEC is in suspended-questions state
    if (aec.status !== 'suspended-questions') {
      throw new Error(`AEC is not in suspended-questions state. Current: ${aec.status}`);
    }

    // Store answers and resume workflow
    aec.setQuestionAnswers(input.answers);
    aec.resumeGenerating();

    // Update generation state to continue to refinement step
    aec.updateGenerationState({
      currentStep: 10,
      steps: aec.generationState.steps.map((step: any) => {
        if (step.id <= 8) {
          return { ...step, status: 'complete' };
        }
        if (step.id === 9) {
          return { ...step, status: 'complete', details: `${Object.keys(input.answers).length} answers submitted` };
        }
        if (step.id === 10) {
          return { ...step, status: 'in-progress' };
        }
        return step;
      }),
    });

    await this.aecRepository.update(aec);

    // If using Mastra workflow, trigger actual workflow resume with answers
    if (USE_MASTRA_WORKFLOW && aec.lockedBy) {
      console.log(`🔄 [ResumeWorkflowUseCase] Resuming Mastra workflow from askQuestions with answers`);
      
      this.mastraService.resumeWorkflow(
        aec.lockedBy, // runId is stored as lockedBy
        'askQuestions',
        { action: 'submit', answers: input.answers }
      ).then((result) => {
        console.log(`✅ [ResumeWorkflowUseCase] Mastra workflow resume result:`, result);
      }).catch((error) => {
        console.error(`❌ [ResumeWorkflowUseCase] Mastra workflow resume failed:`, error);
      });
    }

    console.log(`✅ [ResumeWorkflowUseCase] Answers submitted`);

    return {
      success: true,
      message: 'Answers submitted, workflow continuing',
    };
  }

  /**
   * Skip questions and continue workflow without answers
   */
  async skipQuestions(input: SkipQuestionsInput): Promise<ResumeWorkflowResult> {
    console.log(`⏭️ [ResumeWorkflowUseCase] Skipping questions`);

    const aec = await this.aecRepository.findById(input.aecId);
    if (!aec) {
      throw new Error(`AEC not found: ${input.aecId}`);
    }

    if (aec.workspaceId !== input.workspaceId) {
      throw new Error('AEC not found');
    }

    // Validate AEC is in suspended-questions state
    if (aec.status !== 'suspended-questions') {
      throw new Error(`AEC is not in suspended-questions state. Current: ${aec.status}`);
    }

    // Resume without answers
    aec.resumeGenerating();

    // Update generation state to skip to refinement
    aec.updateGenerationState({
      currentStep: 10,
      steps: aec.generationState.steps.map((step: any) => {
        if (step.id <= 8) {
          return { ...step, status: 'complete' };
        }
        if (step.id === 9) {
          return { ...step, status: 'complete', details: 'Questions skipped' };
        }
        if (step.id === 10) {
          return { ...step, status: 'in-progress' };
        }
        return step;
      }),
    });

    await this.aecRepository.update(aec);

    // If using Mastra workflow, trigger actual workflow resume with skip action
    if (USE_MASTRA_WORKFLOW && aec.lockedBy) {
      console.log(`🔄 [ResumeWorkflowUseCase] Resuming Mastra workflow from askQuestions (skip)`);
      
      this.mastraService.resumeWorkflow(
        aec.lockedBy, // runId is stored as lockedBy
        'askQuestions',
        { action: 'skip' }
      ).then((result) => {
        console.log(`✅ [ResumeWorkflowUseCase] Mastra workflow resume result:`, result);
      }).catch((error) => {
        console.error(`❌ [ResumeWorkflowUseCase] Mastra workflow resume failed:`, error);
      });
    }

    console.log(`✅ [ResumeWorkflowUseCase] Questions skipped`);

    return {
      success: true,
      message: 'Questions skipped, workflow continuing',
    };
  }
}
