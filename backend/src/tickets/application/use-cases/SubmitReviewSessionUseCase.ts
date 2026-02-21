import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import type { ReviewQAItem } from '../../domain/aec/AEC';

export interface SubmitReviewSessionCommand {
  ticketId: string;
  workspaceId: string;
  qaItems: ReviewQAItem[];
}

export interface SubmitReviewSessionResult {
  success: true;
  ticketId: string;
  status: string;
}

/**
 * SubmitReviewSessionUseCase (Story 6-12)
 *
 * Stores Q&A pairs from the CLI reviewer agent on the ticket
 * and transitions status to WAITING_FOR_APPROVAL so the PM
 * can review the answers and trigger a re-bake.
 */
@Injectable()
export class SubmitReviewSessionUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: SubmitReviewSessionCommand): Promise<SubmitReviewSessionResult> {
    // 1. Load ticket
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Verify workspace ownership
    if (aec.workspaceId !== command.workspaceId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    // 3. Submit review session (transitions to WAITING_FOR_APPROVAL)
    aec.submitReviewSession(command.qaItems);

    // 4. Persist
    await this.aecRepository.save(aec);

    return {
      success: true,
      ticketId: aec.id,
      status: aec.status,
    };
  }
}
