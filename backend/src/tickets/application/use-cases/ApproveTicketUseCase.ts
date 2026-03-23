import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { NotificationService } from '../../../notifications/notification.service';

export interface ApproveTicketCommand {
  ticketId: string;
  teamId: string;
}

/**
 * ApproveTicketUseCase (Story 7-8)
 *
 * PM approves a ticket, transitioning it to FORGED.
 * Allowed from REVIEW (after developer refine) or DEV_REFINING (skip developer review).
 * Only PM and ADMIN roles can call this (enforced at controller guard level).
 */
@Injectable()
export class ApproveTicketUseCase {
  private readonly logger = new Logger(ApproveTicketUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly notificationService: NotificationService,
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

    // 3. Validate status precondition — allow from REVIEW or DEV_REFINING
    const approvableStatuses = [AECStatus.REVIEW, AECStatus.DEV_REFINING];
    if (!approvableStatuses.includes(aec.status)) {
      throw new BadRequestException(
        `Ticket cannot be approved in its current status: ${aec.status}`,
      );
    }

    // 4. Approve — transitions to FORGED
    aec.approve();

    // 5. Persist
    await this.aecRepository.save(aec);

    // 6. Send notification (fire-and-forget)
    if (aec.assignedTo) {
      void this.notificationService
        .notifyTicketReady(command.ticketId, aec.assignedTo, aec.title)
        .catch((err) => this.logger.warn('Notification failed (approve)', err));
    }

    return aec;
  }
}
