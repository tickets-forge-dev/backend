import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import {
  InvalidStateTransitionError,
} from '../../../shared/domain/exceptions/DomainExceptions';
import type { ReviewQAItem } from '../../domain/aec/AEC';

export interface StartImplementationCommand {
  ticketId: string;
  teamId: string;
  branchName: string;
  qaItems?: ReviewQAItem[];
}

export interface StartImplementationResult {
  success: true;
  ticketId: string;
  branchName: string;
  status: string;
}

/**
 * StartImplementationUseCase (Story 10-2)
 *
 * Records the implementation branch and optional Q&A from the
 * Forge Developer Agent, then transitions the ticket FORGED → EXECUTING.
 */
@Injectable()
export class StartImplementationUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: StartImplementationCommand): Promise<StartImplementationResult> {
    // 1. Load ticket
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Verify team ownership
    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    // 3. Start implementation (transitions FORGED → EXECUTING)
    try {
      aec.startImplementation(command.branchName, command.qaItems);
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    // 4. Persist
    await this.aecRepository.save(aec);

    return {
      success: true,
      ticketId: aec.id,
      branchName: command.branchName,
      status: aec.status,
    };
  }
}
