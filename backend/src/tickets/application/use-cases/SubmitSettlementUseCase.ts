import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { FileChange, Divergence } from '../../domain/value-objects/ChangeRecord';

export interface SubmitSettlementCommand {
  ticketId: string;
  teamId: string;
  executionSummary: string;
  filesChanged: FileChange[];
  divergences: Divergence[];
}

@Injectable()
export class SubmitSettlementUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: SubmitSettlementCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      aec.deliver({
        executionSummary: command.executionSummary,
        filesChanged: command.filesChanged,
        divergences: command.divergences,
      });

      await this.aecRepository.save(aec);

      return { success: true, ticketId: aec.id, status: aec.status };
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
