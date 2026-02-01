import { Injectable, Inject } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { GenerationOrchestrator } from '../services/GenerationOrchestrator';

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
    private readonly generationOrchestrator: GenerationOrchestrator,
  ) {}

  async execute(command: CreateTicketCommand): Promise<AEC> {
    console.log('🎫 [CreateTicketUseCase] Creating ticket:', command.title);
    console.log('🎫 [CreateTicketUseCase] WorkspaceId:', command.workspaceId);
    
    // Create domain entity
    const aec = AEC.createDraft(
      command.workspaceId,
      command.title,
      command.description,
    );

    console.log('🎫 [CreateTicketUseCase] AEC created:', aec.id);

    // Persist draft
    await this.aecRepository.save(aec);

    console.log('🎫 [CreateTicketUseCase] AEC saved, starting generation...');

    // Trigger 8-step generation process (async - fire and forget)
    // Frontend will subscribe to Firestore for real-time progress
    this.generationOrchestrator.orchestrate(aec).catch((error) => {
      console.error('❌ [CreateTicketUseCase] Generation failed for AEC:', aec.id, error);
      console.error('❌ [CreateTicketUseCase] Error stack:', error.stack);
      // Error is already saved to generationState by orchestrator
    });

    console.log('🎫 [CreateTicketUseCase] Orchestration started (async), returning AEC');

    return aec;
  }
}
