import { Injectable, Logger, Inject } from '@nestjs/common';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DesignReference, validateDesignReferenceUrl } from '../../domain/value-objects/DesignReference';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';

export interface AddDesignReferenceCommand {
  ticketId: string;
  workspaceId: string;
  userId: string; // Firebase UID
  userEmail: string; // For audit trail
  url: string;
  title?: string;
}

export interface AddDesignReferenceResult {
  designReference: DesignReference;
}

/**
 * Add Design Reference Use Case
 *
 * Adds a design link (Figma, Loom, etc.) to a ticket.
 * Validates URL, detects platform, and stores reference.
 *
 * Phase 2 Enhancement:
 * After storing reference, will fetch metadata via FigmaService/LoomService
 * and update the reference with thumbnail, title, etc.
 *
 * Non-blocking: Metadata fetch happens in background, doesn't block response
 */
@Injectable()
export class AddDesignReferenceUseCase {
  private readonly logger = new Logger(AddDesignReferenceUseCase.name);

  constructor(@Inject(AEC_REPOSITORY) private aecRepository: AECRepository) {}

  async execute(command: AddDesignReferenceCommand): Promise<AddDesignReferenceResult> {
    const { ticketId, workspaceId, userEmail, url, title } = command;

    // Validate URL format
    try {
      validateDesignReferenceUrl(url);
    } catch (error) {
      throw new BadRequestException(
        `Invalid design reference URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Fetch ticket
    const aec = await this.aecRepository.findById(ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Verify workspace ownership
    if (aec.workspaceId !== workspaceId) {
      throw new ForbiddenException('Cannot modify ticket from different workspace');
    }

    // Add design reference (domain method handles max limit validation)
    let designReference: DesignReference;
    try {
      designReference = aec.addDesignReference(url, userEmail, title);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to add design reference',
      );
    }

    // Persist ticket
    await this.aecRepository.save(aec);

    this.logger.debug(
      `Added design reference to ticket ${ticketId}: ${url} (platform: ${designReference.platform})`,
    );

    return {
      designReference,
    };
  }
}
