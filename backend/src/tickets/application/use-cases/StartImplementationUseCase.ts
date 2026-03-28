import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import {
  InvalidStateTransitionError,
} from '../../../shared/domain/exceptions/DomainExceptions';
import { NotificationService } from '../../../notifications/notification.service';
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
 * forge Developer Agent, then transitions the ticket APPROVED → EXECUTING.
 * Notifies the ticket creator that development has started.
 */
@Injectable()
export class StartImplementationUseCase {
  private readonly logger = new Logger(StartImplementationUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly notificationService: NotificationService,
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

    // 3. Start implementation (transitions APPROVED → EXECUTING)
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

    // 5. Notify ticket creator (fire-and-forget)
    if (aec.createdBy) {
      void this.notificationService
        .notifyImplementationStarted(command.ticketId, aec.createdBy, aec.title)
        .catch((err) => this.logger.warn('Notification failed (start-implementation)', err));
    }

    return {
      success: true,
      ticketId: aec.id,
      branchName: command.branchName,
      status: aec.status,
    };
  }
}
