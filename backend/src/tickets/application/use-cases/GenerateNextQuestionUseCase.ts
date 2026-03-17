import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import {
  TechSpecGenerator,
  ClarificationQuestion,
  CodebaseContext,
} from '../../domain/tech-spec/TechSpecGenerator';
import { TECH_SPEC_GENERATOR } from '../ports/TechSpecGeneratorPort';
import { CodebaseAnalyzer } from '../../domain/pattern-analysis/CodebaseAnalyzer';
import { ProjectStackDetector } from '../../domain/stack-detection/ProjectStackDetector';
import { GitHubFileService } from '@github/domain/github-file.service';
import { CODEBASE_ANALYZER } from '../ports/CodebaseAnalyzerPort';
import { PROJECT_STACK_DETECTOR } from '../ports/ProjectStackDetectorPort';
import { GITHUB_FILE_SERVICE } from '../ports/GitHubFileServicePort';

export interface GenerateNextQuestionCommand {
  aecId: string;
  teamId: string;
  previousAnswers: Record<string, string | string[]>;
}

/**
 * GenerateNextQuestionUseCase - Generate one clarification question at a time
 *
 * Implements the conversational, dynamic question flow:
 * 1. Load AEC and its already-asked questions
 * 2. Build Q&A pairs from stored questions + provided answers
 * 3. Hard cap at 5 questions total
 * 4. Call TechSpecGenerator.generateNextQuestion() for the next question
 * 5. If a question is returned, append it to the AEC
 * 6. Store assumptions
 * 7. Return { question, assumptions }
 */
@Injectable()
export class GenerateNextQuestionUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(TECH_SPEC_GENERATOR)
    private readonly techSpecGenerator: TechSpecGenerator,
    @Inject(CODEBASE_ANALYZER)
    private readonly codebaseAnalyzer: CodebaseAnalyzer,
    @Inject(PROJECT_STACK_DETECTOR)
    private readonly stackDetector: ProjectStackDetector,
    @Inject(GITHUB_FILE_SERVICE)
    private readonly githubFileService: GitHubFileService,
  ) {}

  async execute(
    command: GenerateNextQuestionCommand,
  ): Promise<{ question: ClarificationQuestion | null; assumptions: string[]; reasoning: string }> {
    // Load AEC
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec) {
      throw new NotFoundException(`AEC ${command.aecId} not found`);
    }
    if (aec.teamId !== command.teamId) {
      throw new BadRequestException('Workspace mismatch');
    }

    const existingQuestions = aec.questions;

    // Hard cap: max 5 questions
    if (existingQuestions.length >= 5) {
      return { question: null, assumptions: aec.assumptions, reasoning: 'Maximum of 5 questions reached.' };
    }

    // Build Q&A pairs from existing questions + provided answers
    const previousQAs = existingQuestions.map((q) => ({
      question: q.question,
      answer: command.previousAnswers[q.id] ?? '_skipped',
    }));

    // Build codebase context
    const codebaseContext = await this.buildCodebaseContext(aec);

    // Generate next question
    const result = await this.techSpecGenerator.generateNextQuestion({
      title: aec.title,
      description: aec.description ?? undefined,
      context: codebaseContext,
      previousQAs,
    });

    // If a question was returned, append it to the AEC
    if (result.question) {
      aec.addQuestion(result.question);
    }

    // Store assumptions
    if (result.assumptions.length > 0) {
      aec.setClarificationAssumptions(result.assumptions);
    }

    // Persist
    await this.aecRepository.save(aec);

    return result;
  }

  /**
   * Build codebase context from AEC repository context.
   * Mirrors the logic in GenerateQuestionsUseCase.
   */
  private async buildCodebaseContext(aec: any): Promise<CodebaseContext | null> {
    const repoContext = aec.repositoryContext;
    if (!repoContext) {
      return null;
    }

    try {
      const [owner, repo] = repoContext.repositoryFullName.split('/');

      const fileTree = await this.githubFileService.getTree(owner, repo, repoContext.branchName);

      const filesMap = new Map<string, string>();
      const keyFiles = ['package.json', 'tsconfig.json', 'requirements.txt', 'Dockerfile', 'pom.xml'];

      for (const fileName of keyFiles) {
        try {
          const content = await this.githubFileService.readFile(owner, repo, fileName, repoContext.branchName);
          filesMap.set(fileName, content);
        } catch {
          // File may not exist
        }
      }

      const stack = await this.stackDetector.detectStack(filesMap);
      const analysis = await this.codebaseAnalyzer.analyzeStructure(filesMap, fileTree);

      return {
        stack,
        analysis,
        fileTree,
        files: filesMap,
        taskAnalysis: aec.taskAnalysis,
      };
    } catch {
      return null;
    }
  }
}
