import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { TechSpecGeneratorImpl } from '../services/TechSpecGeneratorImpl';
import { AEC } from '../../domain/aec/AEC';

export interface GenerateWireframesCommand {
  ticketId: string;
  teamId: string;
  wireframeContext?: string;
}

/**
 * GenerateWireframesUseCase — Generate visual expectations for an existing ticket
 *
 * Allows users to generate wireframes after ticket creation, even if they
 * initially chose to skip wireframe generation.
 *
 * Prerequisites: ticket must have a finalized techSpec with solution and
 * acceptance criteria (the raw material for visual expectation generation).
 */
@Injectable()
export class GenerateWireframesUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly techSpecGenerator: TechSpecGeneratorImpl,
  ) {}

  async execute(command: GenerateWireframesCommand): Promise<AEC> {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Workspace mismatch');
    }

    const techSpec = aec.techSpec;
    if (!techSpec) {
      throw new BadRequestException('Ticket must have a finalized tech spec before generating wireframes');
    }

    // Generate visual expectations from existing tech spec data
    const visualExpectations = await this.techSpecGenerator.generateVisualExpectations(
      techSpec.solution,
      techSpec.acceptanceCriteria,
      techSpec.fileChanges,
      techSpec.apiChanges,
      // Minimal context — we don't need full codebase context for wireframes
      {
        stack: {
          framework: techSpec.stack?.framework ? { name: techSpec.stack.framework, version: '0.0.0', majorVersion: 0 } : null,
          language: { name: techSpec.stack?.language || 'unknown', detected: true, confidence: 100 },
          packageManager: { type: (techSpec.stack?.packageManager as 'npm' | 'yarn' | 'pnpm' | 'bun') || 'npm' },
          dependencies: [],
          devDependencies: [],
          tooling: {},
          hasWorkspaces: false,
          isMonorepo: false,
        },
        analysis: {
          architecture: { type: 'unknown', confidence: 0, signals: [], directories: [] },
          naming: { files: 'kebab-case', variables: 'camelCase', functions: 'camelCase', classes: 'PascalCase', components: 'PascalCase', confidence: 0 },
          testing: { runner: null, location: 'colocated', namingPattern: '*.test.ts', libraries: [], confidence: 0 },
          stateManagement: { type: 'unknown', packages: [], patterns: [], confidence: 0 },
          apiRouting: { type: 'unknown', baseDirectory: '', conventions: [], confidence: 0 },
          directories: [],
          overallConfidence: 0,
          recommendations: [],
        },
        fileTree: { sha: '', url: '', tree: [], truncated: false },
        files: new Map(),
      },
      command.wireframeContext,
    );

    if (!visualExpectations) {
      throw new BadRequestException('Failed to generate visual expectations — the AI returned no results');
    }

    // Patch techSpec with new visual expectations
    aec.setTechSpec({
      ...techSpec,
      visualExpectations,
    });

    await this.aecRepository.save(aec);

    console.log(`✨ [GenerateWireframesUseCase] Generated ${visualExpectations.expectations.length} visual expectations for ticket ${command.ticketId}`);

    // Regenerate HTML wireframe if enabled (fire-and-forget)
    if (aec.includeHtmlWireframes && visualExpectations.expectations?.length) {
      const asciiWireframes = visualExpectations.expectations
        .filter((e: any) => e.wireframe)
        .map((e: any) => `## ${e.screen} (${e.state})\n${e.wireframe}`)
        .join('\n\n');

      if (asciiWireframes) {
        const solutionContext = typeof techSpec.solution === 'object' && techSpec.solution !== null
          ? JSON.stringify(techSpec.solution)
          : String(techSpec.solution ?? '');

        this.techSpecGenerator
          .generateHtmlWireframe(techSpec.title, asciiWireframes, solutionContext, {
            teamId: command.teamId,
            ticketId: command.ticketId,
          }, { designTokens: techSpec.designTokens, stack: techSpec.stack })
          .then(async (html) => {
            if (!html) return;
            const freshAec = await this.aecRepository.findById(command.ticketId);
            if (!freshAec?.techSpec) return;
            freshAec.setTechSpec({ ...freshAec.techSpec, wireframeHtml: html });
            await this.aecRepository.save(freshAec);
            console.log(`✨ [GenerateWireframesUseCase] HTML wireframe saved for ticket ${command.ticketId} (${html.length} chars)`);
          })
          .catch((error) => {
            console.error(`✨ [GenerateWireframesUseCase] HTML wireframe generation failed: ${error instanceof Error ? error.message : String(error)}`);
          });
      }
    }

    return aec;
  }
}
