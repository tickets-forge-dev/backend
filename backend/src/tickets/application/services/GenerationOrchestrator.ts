import { Injectable, Inject } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import {
  ILLMContentGenerator,
  LLM_CONTENT_GENERATOR,
} from '../../../shared/application/ports/ILLMContentGenerator';
import { GenerationStateFactory } from '../../domain/value-objects/GenerationState';
import { TicketType } from '../../domain/value-objects/AECStatus';
import { Question } from '../../domain/value-objects/Question';
import { Estimate } from '../../domain/value-objects/Estimate';
import { ValidationResult, ValidatorType } from '../../domain/value-objects/ValidationResult';
import { IndexQueryService } from '../../../indexing/application/services/index-query.service';
import { IndexRepository, INDEX_REPOSITORY } from '../../../indexing/domain/IndexRepository';

/**
 * Application Service - Generation Orchestrator
 * 
 * Orchestrates the 8-step ticket generation process:
 * 1. Intent extraction (LLM)
 * 2. Type detection (LLM)
 * 3. Repo index query (stub for Epic 2)
 * 4. API snapshot resolution (stub for Epic 2)
 * 5. Ticket drafting (LLM)
 * 6. Validation (stub for Epic 2)
 * 7. Question prep (LLM)
 * 8. Estimation (stub for Epic 2)
 * 
 * Updates AEC generationState in Firestore after each step
 * for real-time UI updates.
 */
@Injectable()
export class GenerationOrchestrator {
  private readonly STEP_TIMEOUT_MS = 30000; // 30 seconds per step

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(LLM_CONTENT_GENERATOR)
    private readonly llmGenerator: ILLMContentGenerator,
    private readonly indexQueryService: IndexQueryService,
    @Inject(INDEX_REPOSITORY)
    private readonly indexRepository: IndexRepository,
  ) {}

  /**
   * Execute all 8 generation steps sequentially
   * Updates Firestore after each step for real-time progress
   */
  async orchestrate(aec: AEC): Promise<void> {
    console.log('🚀 [GenerationOrchestrator] Starting orchestration for AEC:', aec.id);
    
    // Initialize generation state with 8 steps
    const generationState = GenerationStateFactory.initial();
    aec.updateGenerationState(generationState);
    await this.aecRepository.update(aec);

    console.log('🚀 [GenerationOrchestrator] Generation state initialized');

    try {
      // Step 1: Intent extraction (LLM)
      const intent = await this.executeStep(aec, 1, async () => {
        return await this.llmGenerator.extractIntent({
          title: aec.title,
          description: aec.description || undefined,
        });
      });

      // Step 2: Type detection (LLM)
      const typeDetection = await this.executeStep(aec, 2, async () => {
        return await this.llmGenerator.detectType(intent.intent);
      });

      // Step 3: Repo index query (Epic 4.2 - Code Context)
      const repoContext = await this.executeStep(aec, 3, async () => {
        return this.queryRepoIndex(aec, intent.intent);
      });

      // Step 4: API snapshot resolution (stub - Epic 4)
      const apiContext = await this.executeStep(aec, 4, async () => {
        return this.stubApiSnapshot();
      });

      // Step 5: Ticket drafting (LLM)
      const draft = await this.executeStep(aec, 5, async () => {
        return await this.llmGenerator.generateDraft({
          intent: intent.intent,
          type: typeDetection.type,
          repoContext: repoContext,
          apiContext: apiContext,
        });
      });

      // Update AEC content with draft
      aec.updateContent(
        typeDetection.type as TicketType,
        draft.acceptanceCriteria,
        draft.assumptions,
        draft.repoPaths,
      );

      // Step 6: Validation (stub - Epic 3)
      const validationResults = await this.executeStep(aec, 6, async () => {
        return this.stubValidation();
      });

      // Step 7: Question prep (LLM)
      const questionSet = await this.executeStep(aec, 7, async () => {
        return await this.llmGenerator.generateQuestions({
          draft,
          validationIssues: validationResults,
        });
      });

      // Map questions to domain objects
      const questions: Question[] = questionSet.questions.slice(0, 3).map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type === 'binary' ? 'binary' : 'multi-choice',
        options: q.options.map((o) => ({ label: o.label, value: o.value })),
        defaultAssumption: q.defaultAssumption,
      }));
      aec.addQuestions(questions);

      // Step 8: Estimation (stub - Epic 4)
      const estimate = await this.executeStep(aec, 8, async () => {
        return this.stubEstimation();
      });

      aec.setEstimate(estimate);

      // Mark as validated with results
      const finalValidationResults: ValidationResult[] = validationResults.map((v) =>
        ValidationResult.create({
          criterion: ValidatorType.COMPLETENESS, // Stub uses completeness for now
          passed: v.passed,
          score: v.score,
          weight: v.weight,
          issues: [],
          blockers: [],
          message: v.message || 'Validation placeholder',
        }),
      );
      aec.validate(finalValidationResults);

      // Final save with validated status
      await this.aecRepository.update(aec);
    } catch (error) {
      console.error('Generation orchestration failed:', error);
      throw error;
    }
  }

  /**
   * Execute a single generation step with timeout and error handling
   * Updates generationState before/after step execution
   */
  private async executeStep<T>(
    aec: AEC,
    stepNum: number,
    stepFn: () => Promise<T>,
  ): Promise<T> {
    const state = aec.generationState;
    const step = state.steps[stepNum - 1];

    // Mark step as in-progress
    step.status = 'in-progress';
    state.currentStep = stepNum;
    aec.updateGenerationState(state);
    await this.aecRepository.update(aec);

    try {
      // Execute with timeout
      const result = await this.withTimeout(stepFn(), this.STEP_TIMEOUT_MS);

      // Mark step as complete
      step.status = 'complete';
      step.details = JSON.stringify(result);
      delete step.error;
      aec.updateGenerationState(state);
      await this.aecRepository.update(aec);

      return result;
    } catch (error: any) {
      // Mark step as failed
      step.status = 'failed';
      step.error =
        error.name === 'TimeoutError'
          ? 'Step timed out after 30 seconds'
          : error.message || 'Unknown error occurred';
      aec.updateGenerationState(state);
      await this.aecRepository.update(aec);

      throw error;
    }
  }

  /**
   * Wrap promise with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const error = new Error('Operation timed out');
        error.name = 'TimeoutError';
        reject(error);
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  // ============================================
  // STUB IMPLEMENTATIONS (Epic 2)
  // ============================================

  /**
   * Query repo index for relevant code context
   * Uses the selected repository's index to find relevant modules
   */
  private async queryRepoIndex(aec: AEC, intent: string): Promise<string> {
    // If no repository context selected, return empty
    if (!aec.repositoryContext) {
      console.log('🔍 [GenerationOrchestrator] No repository context, skipping index query');
      return '';
    }

    try {
      const { repositoryFullName } = aec.repositoryContext;
      console.log(`🔍 [GenerationOrchestrator] Querying index for repo: ${repositoryFullName}`);

      // Find all indexes for this workspace
      const indexes = await this.indexRepository.findByWorkspace(aec.workspaceId);

      // Find the latest completed index for this repository by name
      const completedIndex = indexes.find(
        idx => idx.repositoryName === repositoryFullName && idx.status === 'completed'
      );

      if (!completedIndex) {
        console.log(`⚠️ [GenerationOrchestrator] No completed index found for ${repositoryFullName}`);
        return '';
      }

      console.log(`🔍 [GenerationOrchestrator] Found index: ${completedIndex.id}, querying with intent...`);

      // Query index for relevant modules
      const modules = await this.indexQueryService.findModulesByIntent(
        intent,
        completedIndex.id,
        10, // Top 10 most relevant modules
      );

      console.log(`✅ [GenerationOrchestrator] Found ${modules.length} relevant modules`);

      // Format modules into context string for LLM
      if (modules.length === 0) {
        return '';
      }

      const contextLines = [
        `# Repository Context: ${repositoryFullName}`,
        `# Found ${modules.length} relevant code modules:\n`,
      ];

      for (const module of modules) {
        contextLines.push(`## ${module.path} (${module.language})`);
        contextLines.push(`Relevance: ${(module.relevanceScore * 100).toFixed(0)}%`);
        contextLines.push(`Summary: ${module.summary}`);
        
        if (module.exports.length > 0) {
          contextLines.push(`Exports: ${module.exports.join(', ')}`);
        }
        if (module.classes.length > 0) {
          contextLines.push(`Classes: ${module.classes.join(', ')}`);
        }
        if (module.functions.length > 0) {
          contextLines.push(`Functions: ${module.functions.join(', ')}`);
        }
        contextLines.push(''); // Empty line between modules
      }

      return contextLines.join('\n');
    } catch (error) {
      console.error('❌ [GenerationOrchestrator] Index query failed:', error);
      return ''; // Graceful degradation - continue without context
    }
  }

  /**
   * Stub: API snapshot resolution (Epic 4.3)
   * Returns empty string for now
   */
  private async stubApiSnapshot(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return '';
  }

  /**
   * Stub: Validation (Epic 3)
   * Returns placeholder validation results
   */
  private async stubValidation(): Promise<
    Array<{
      criterion: string;
      score: number;
      weight: number;
      passed: boolean;
      message: string;
    }>
  > {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return [
      {
        criterion: 'completeness',
        score: 60,
        weight: 1,
        passed: true,
        message: 'Basic information present',
      },
      {
        criterion: 'clarity',
        score: 50,
        weight: 1,
        passed: true,
        message: 'Placeholder validation - Epic 3 will implement full scoring',
      },
    ];
  }

  /**
   * Stub: Estimation (Epic 4)
   * Returns default estimate
   */
  private async stubEstimation(): Promise<Estimate> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      min: 4,
      max: 8,
      confidence: 'medium',
      drivers: ['Placeholder estimate - Epic 4 will implement full calculation'],
    };
  }
}
