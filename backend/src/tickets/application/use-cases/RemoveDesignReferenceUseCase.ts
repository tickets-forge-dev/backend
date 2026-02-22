import { Injectable, Logger, Inject } from '@nestjs/common';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';

export interface RemoveDesignReferenceCommand {
  ticketId: string;
  referenceId: string;
  teamId: string;
}

export interface RemoveDesignReferenceResult {
  success: boolean;
}

/**
 * Remove Design Reference Use Case
 *
 * Removes a design link from a ticket.
 */
@Injectable()
export class RemoveDesignReferenceUseCase {
  private readonly logger = new Logger(RemoveDesignReferenceUseCase.name);

  constructor(@Inject(AEC_REPOSITORY) private aecRepository: AECRepository) {}

  async execute(command: RemoveDesignReferenceCommand): Promise<RemoveDesignReferenceResult> {
    const { ticketId, referenceId, teamId } = command;

    // Fetch ticket
    const aec = await this.aecRepository.findById(ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Verify workspace ownership
    if (aec.teamId !== teamId) {
      throw new ForbiddenException('Cannot modify ticket from different workspace');
    }

    // Remove design reference
    aec.removeDesignReference(referenceId);

    // Persist ticket
    await this.aecRepository.save(aec);

    this.logger.debug(`Removed design reference ${referenceId} from ticket ${ticketId}`);

    return {
      success: true,
    };
  }
}
