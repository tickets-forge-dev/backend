import { Injectable, Logger, Inject } from '@nestjs/common';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DesignReference, validateDesignReferenceUrl } from '../../domain/value-objects/DesignReference';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { FetchDesignMetadataUseCase } from './FetchDesignMetadataUseCase';

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
 * After storing reference, asynchronously fetches metadata via FigmaService/LoomService
 * and updates the reference with thumbnail, title, etc.
 *
 * Non-blocking: Metadata fetch happens in background, doesn't block response.
 * If metadata fetch fails, the design reference is still stored and returned.
 */
@Injectable()
export class AddDesignReferenceUseCase {
  private readonly logger = new Logger(AddDesignReferenceUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY) private aecRepository: AECRepository,
    private fetchDesignMetadataUseCase: FetchDesignMetadataUseCase,
  ) {}

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

    // Fetch metadata asynchronously (non-blocking)
    // Design reference is already stored and returned, metadata is enriched in background
    this.fetchAndUpdateMetadata(ticketId, designReference, workspaceId);

    return {
      designReference,
    };
  }

  /**
   * Fetch and update design reference metadata asynchronously
   * Runs in background without blocking the response
   * @private
   */
  private async fetchAndUpdateMetadata(
    ticketId: string,
    designReference: DesignReference,
    workspaceId: string,
  ): Promise<void> {
    try {
      // Fetch metadata from platform API
      const enrichedReference = await this.fetchDesignMetadataUseCase.execute(
        designReference,
        workspaceId,
      );

      // If metadata was fetched, update the ticket
      if (enrichedReference.metadata) {
        const aec = await this.aecRepository.findById(ticketId);
        if (aec) {
          // Update the design reference with metadata
          aec.updateDesignReferenceMetadata(
            designReference.id,
            enrichedReference.metadata,
          );
          await this.aecRepository.save(aec);

          this.logger.debug(
            `Updated design reference metadata for ${designReference.platform} link in ticket ${ticketId}`,
          );
        }
      }
    } catch (error) {
      // Log error but don't throw - metadata enrichment is optional
      this.logger.warn(
        `Failed to fetch metadata for design reference in ticket ${ticketId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
