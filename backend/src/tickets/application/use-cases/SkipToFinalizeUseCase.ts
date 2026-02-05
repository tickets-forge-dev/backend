import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';

/**
 * Input command for skipping to finalize
 */
export interface SkipToFinalizeCommand {
  aecId: string;
  workspaceId: string;
}

/**
 * SkipToFinalizeUseCase - Allow user to manually skip remaining rounds
 *
 * User can explicitly skip remaining question rounds at any point and proceed
 * directly to final spec generation. This is useful when:
 * - User is confident with current information
 * - User prefers to iterate on the generated spec
 * - User wants to save time and use the agent's best guess
 *
 * Process:
 * 1. Load AEC aggregate
 * 2. Call skipToFinalize() on domain entity
 * 3. Transition AEC to QUESTIONS_COMPLETE status
 * 4. Mark current round as skipped in domain
 * 5. Persist changes
 *
 * Throws:
 * - NotFoundException if AEC not found
 * - BadRequestException if workspace mismatch or invalid state
 */
@Injectable()
export class SkipToFinalizeUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  /**
   * Execute the use case: Skip remaining rounds and finalize
   */
  async execute(command: SkipToFinalizeCommand): Promise<AEC> {
    console.log(`⏭️  [SkipToFinalizeUseCase] Skipping to finalize for AEC ${command.aecId}`);

    // Load AEC
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec) {
      throw new NotFoundException(`AEC ${command.aecId} not found`);
    }

    // Verify workspace ownership
    if (aec.workspaceId !== command.workspaceId) {
      throw new BadRequestException('Workspace mismatch');
    }

    // Call domain method to skip and transition state
    aec.skipToFinalize();

    console.log(`⏭️  [SkipToFinalizeUseCase] AEC transitioned to QUESTIONS_COMPLETE`);

    // Persist changes
    await this.aecRepository.save(aec);

    console.log(`⏭️  [SkipToFinalizeUseCase] Changes persisted, ready for finalization`);

    return aec;
  }
}
