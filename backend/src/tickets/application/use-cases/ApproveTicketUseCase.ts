import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';

export interface ApproveTicketCommand {
  ticketId: string;
  teamId: string;
}

/**
 * ApproveTicketUseCase (Story 7-8)
 *
 * PM approves a ticket that has been reviewed and re-baked with developer Q&A.
 * Validates the ticket is in REVIEW status, then transitions → FORGED.
 * Only PM and ADMIN roles can call this (enforced at controller guard level).
 */
@Injectable()
export class ApproveTicketUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: ApproveTicketCommand): Promise<AEC> {
    // 1. Load ticket
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Verify team ownership
    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your team');
    }

    // 3. Validate status precondition
    if (aec.status !== AECStatus.REVIEW) {
      throw new BadRequestException(
        `Ticket cannot be approved in its current status: ${aec.status}`,
      );
    }

    // 4. Approve — transitions REVIEW → FORGED
    aec.approve();

    // 5. Persist
    await this.aecRepository.save(aec);

    return aec;
  }
}
