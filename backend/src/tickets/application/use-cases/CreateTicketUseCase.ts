import { Injectable, Inject } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { GenerationStateFactory } from '../../domain/value-objects/GenerationState';

export interface CreateTicketCommand {
  workspaceId: string;
  title: string;
  description?: string;
}

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: CreateTicketCommand): Promise<AEC> {
    // Create domain entity
    const aec = AEC.createDraft(
      command.workspaceId,
      command.title,
      command.description,
    );

    // Initialize generation state
    const generationState = GenerationStateFactory.initial();
    aec.updateGenerationState(generationState);

    // Persist
    await this.aecRepository.save(aec);

    // TODO: Trigger 8-step generation process (async)
    // This will be implemented in subsequent commits:
    // 1. Intent extraction (Mastra)
    // 2. Type detection (Mastra)
    // 3. Repo index query (stub for now)
    // 4. API snapshot resolution (stub for now)
    // 5. Ticket drafting (Mastra)
    // 6. Validation (stub for now - full implementation in Epic 3)
    // 7. Question prep (Mastra)
    // 8. Estimation (stub for now - full implementation in Epic 4)

    return aec;
  }
}
