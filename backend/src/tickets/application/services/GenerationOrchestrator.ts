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
import { ValidationResult } from '../../domain/value-objects/ValidationResult';
import { ValidationEngine } from './validation/ValidationEngine';
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
  private readonly STEP_TIMEOUT_MS = 90000; // 90 seconds per step (LLM calls can be slow)

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(LLM_CONTENT_GENERATOR)
    private readonly llmGenerator: ILLMContentGenerator,
    private readonly indexQueryService: IndexQueryService,
    @Inject(INDEX_REPOSITORY)
    private readonly indexRepository: IndexRepository,
    private readonly validationEngine: ValidationEngine,
  ) {}

  /**
   * Execute all 8 generation steps sequentially
   * Updates Firestore after each step for real-time progress
   */
  async orchestrate(aec: AEC): Promise<void> {
    console.log('🚀 [GenerationOrchestrator] Starting orchestration for AEC:', aec.id);
    
    // Generate workflow run ID for locking
    const workflowRunId = `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Transition to GENERATING state (locks AEC and validates transition)
    aec.startGenerating(workflowRunId);
    
    // Initialize generation state with 8 steps
    const generationState = GenerationStateFactory.initial();
    aec.updateGenerationState(generationState);
    await this.aecRepository.update(aec);

    console.log('🚀 [GenerationOrchestrator] Generation state initialized, status:', aec.status);

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

      // Step 6: Validation (Epic 3 - Story 3-1)
      console.log('🔍 [Step 6] Running comprehensive validation...');
      const validationResults = await this.executeStep(aec, 6, async () => {
        return await this.validationEngine.validate(aec);
      });

      // Mark AEC as validated with results
      aec.validate(validationResults);
      await this.aecRepository.update(aec);

      // Log detailed validation summary
      const summary = this.validationEngine.getValidationSummary(validationResults);
      console.log(`\n📊 [Validation Summary]`);
      console.log(`   Overall Score: ${(summary.overallScore * 100).toFixed(1)}% ${summary.passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Validators Passed: ${summary.passedValidators}/${summary.totalValidators}`);
      console.log(`   Total Issues Found: ${summary.totalIssues}`);
      console.log(`   Critical Blockers: ${summary.criticalIssues}`);
      
      // Log individual validator results
      console.log(`\n   Individual Scores:`);
      validationResults.forEach(vr => {
        const icon = vr.passed ? '✅' : '❌';
        const score = (vr.score * 100).toFixed(0);
        const weight = vr.weight.toFixed(1);
        console.log(`     ${icon} ${vr.criterion.padEnd(20)} ${score}% (weight: ${weight})`);
      });
      
      // Log issues if any
      const allIssues = validationResults.flatMap(vr => vr.issues);
      if (allIssues.length > 0) {
        console.log(`\n   ⚠️  Issues Detected:`);
        allIssues.slice(0, 5).forEach((issue, i) => {
          console.log(`     ${i + 1}. ${issue}`);
        });
        if (allIssues.length > 5) {
          console.log(`     ... and ${allIssues.length - 5} more`);
        }
      }

      // Step 7: Question prep (LLM)
      const questionSet = await this.executeStep(aec, 7, async () => {
        // Pass validation results to question generation
        return await this.llmGenerator.generateQuestions({
          draft,
          validationIssues: validationResults.map(vr => ({
            criterion: vr.criterion,
            passed: vr.passed,
            score: vr.score,
            issues: vr.issues,
            message: vr.message,
          })),
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

      // Final save with validated status
      await this.aecRepository.update(aec);
    } catch (error) {
      console.error('❌ [GenerationOrchestrator] Generation failed:', error);
      
      // Mark AEC as failed and unlock
      try {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        aec.markAsFailed(errorMessage);
        await this.aecRepository.update(aec);
        console.log('❌ [GenerationOrchestrator] AEC marked as failed');
      } catch (failError) {
        console.error('❌ [GenerationOrchestrator] Could not mark AEC as failed:', failError);
      }
      
      throw error;
    }
  }

  /**
   * Execute a single generation step with timeout and error handling
   * Updates generationState before/after step execution
   */
  /**
   * Format step result for PM-friendly display
   */
  private formatStepDetails(stepNum: number, result: any): string {
    switch (stepNum) {
      case 1: // Intent extraction
        return `Identified user intent: "${result.intent?.substring(0, 100) || 'Processing user request'}..."`;
      
      case 2: // Type detection
        return `Detected as ${result.type} ticket${result.confidence ? ` (${Math.round(result.confidence * 100)}% confidence)` : ''}`;
      
      case 3: // Repo index query
        if (!result || result.length === 0) {
          return 'No repository context selected';
        }
        const codeFileCount = (result.match(/```/g) || []).length / 2;
        return `Found ${Math.floor(codeFileCount)} relevant code ${codeFileCount === 1 ? 'file' : 'files'} from repository`;
      
      case 4: // API snapshot
        return result ? 'API documentation loaded' : 'No external API documentation needed';
      
      case 5: // Ticket drafting
        const acCount = result.acceptanceCriteria?.length || 0;
        const assumptionCount = result.assumptions?.length || 0;
        return `Generated ${acCount} acceptance ${acCount === 1 ? 'criterion' : 'criteria'} and ${assumptionCount} ${assumptionCount === 1 ? 'assumption' : 'assumptions'}`;
      
      case 6: // Validation
        if (Array.isArray(result)) {
          const passed = result.filter(r => r.passed).length;
          const total = result.length;
          const overallScore = result.reduce((sum, r) => sum + (r.score * r.weight), 0) / 
                              result.reduce((sum, r) => sum + r.weight, 0);
          return `Validation complete: ${passed}/${total} criteria passed (${Math.round(overallScore * 100)}% overall score)`;
        }
        return 'Validation complete';
      
      case 7: // Question generation
        const questionCount = result.questions?.length || 0;
        return questionCount > 0 
          ? `Generated ${questionCount} clarification ${questionCount === 1 ? 'question' : 'questions'} to refine requirements`
          : 'No clarification questions needed';
      
      case 8: // Estimation
        if (result.min && result.max) {
          return `Estimated ${result.min}-${result.max} hours (${result.confidence} confidence)`;
        }
        return 'Effort estimation complete';
      
      default:
        return 'Step complete';
    }
  }

  private async executeStep<T>(
    aec: AEC,
    stepNum: number,
    stepFn: () => Promise<T>,
  ): Promise<T> {
    const state = aec.generationState;
    const step = state.steps[stepNum - 1];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 [Step ${stepNum}/${state.steps.length}] ${step.title}`);
    console.log(`${'='.repeat(60)}`);

    // Mark step as in-progress
    step.status = 'in-progress';
    state.currentStep = stepNum;
    aec.updateGenerationState(state);
    await this.aecRepository.update(aec);

    const startTime = Date.now();

    try {
      // Execute with timeout
      console.log(`⏳ [Step ${stepNum}] Executing...`);
      const result = await this.withTimeout(stepFn(), this.STEP_TIMEOUT_MS);
      
      const duration = Date.now() - startTime;
      
      // Format user-friendly details
      const userFriendlyDetails = this.formatStepDetails(stepNum, result);

      // Mark step as complete
      step.status = 'complete';
      step.details = userFriendlyDetails;
      delete step.error;
      aec.updateGenerationState(state);
      await this.aecRepository.update(aec);

      console.log(`✅ [Step ${stepNum}] Complete in ${duration}ms`);
      console.log(`📝 [Step ${stepNum}] ${userFriendlyDetails}`);

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Mark step as failed
      step.status = 'failed';
      step.error =
        error.name === 'TimeoutError'
          ? 'Step timed out after 30 seconds'
          : error.message || 'Unknown error occurred';
      aec.updateGenerationState(state);
      await this.aecRepository.update(aec);

      console.error(`❌ [Step ${stepNum}] Failed after ${duration}ms`);
      console.error(`❌ [Step ${stepNum}] Error:`, error.message);

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
