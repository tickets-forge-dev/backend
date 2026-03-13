import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { TechSpecGeneratorImpl } from '../services/TechSpecGeneratorImpl';

export interface RefineWireframeCommand {
  ticketId: string;
  teamId: string;
  userId: string;
  instruction: string;
  currentElements: any[];
}

/**
 * RefineWireframeUseCase — AI-powered Excalidraw wireframe refinement
 *
 * Takes current Excalidraw elements + natural language instruction,
 * returns modified elements. Does NOT persist — user must click Save.
 */
@Injectable()
export class RefineWireframeUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly techSpecGenerator: TechSpecGeneratorImpl,
  ) {}

  async execute(command: RefineWireframeCommand): Promise<any[]> {
    // Load and validate ticket
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Workspace mismatch');
    }

    // Refine wireframe via LLM
    const refinedElements = await this.techSpecGenerator.refineExcalidrawWireframe(
      command.currentElements,
      command.instruction,
    );

    return refinedElements;
  }
}
