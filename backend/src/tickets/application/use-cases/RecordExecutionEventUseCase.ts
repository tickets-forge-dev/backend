import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { ExecutionEventType } from '../../domain/value-objects/ExecutionEvent';

export interface RecordExecutionEventCommand {
  ticketId: string;
  teamId: string;
  type: string;
  title: string;
  description: string;
}

@Injectable()
export class RecordExecutionEventUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: RecordExecutionEventCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      const event = aec.recordExecutionEvent({
        type: command.type as ExecutionEventType,
        title: command.title,
        description: command.description,
      });

      await this.aecRepository.save(aec);

      return { success: true, eventId: event.id, ticketId: aec.id };
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
