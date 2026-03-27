import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';

export interface ReviewDeliveryCommand {
  ticketId: string;
  teamId: string;
  action: 'accept' | 'request_changes';
  note?: string;
}

@Injectable()
export class ReviewDeliveryUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: ReviewDeliveryCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      if (command.action === 'accept') {
        aec.acceptDelivery();
      } else {
        aec.requestChanges(command.note ?? '');
      }

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
