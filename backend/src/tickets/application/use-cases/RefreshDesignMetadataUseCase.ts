import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { FetchDesignMetadataUseCase } from './FetchDesignMetadataUseCase';

export interface RefreshDesignMetadataCommand {
  ticketId: string;
  referenceId: string;
  workspaceId: string;
}

/**
 * Refresh Design Metadata Use Case
 *
 * Manually triggers a re-fetch of design reference metadata (thumbnails, tokens, etc.)
 * Useful when:
 * - Initial fetch failed or timed out
 * - Figma file was updated with new designs/colors
 * - User wants to refresh stale metadata
 */
@Injectable()
export class RefreshDesignMetadataUseCase {
  private readonly logger = new Logger(RefreshDesignMetadataUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY) private aecRepository: AECRepository,
    private fetchDesignMetadataUseCase: FetchDesignMetadataUseCase,
  ) {}

  async execute(command: RefreshDesignMetadataCommand) {
    const { ticketId, referenceId, workspaceId } = command;

    // Fetch ticket
    const aec = await this.aecRepository.findById(ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Verify workspace ownership
    if (aec.workspaceId !== workspaceId) {
      throw new BadRequestException('Cannot modify ticket from different workspace');
    }

    // Find the design reference
    const designRef = aec.designReferences.find((ref) => ref.id === referenceId);
    if (!designRef) {
      throw new NotFoundException(`Design reference ${referenceId} not found in ticket ${ticketId}`);
    }

    this.logger.debug(`Refreshing metadata for design reference ${referenceId} in ticket ${ticketId}`);

    // Re-fetch metadata (will update tokens, thumbnails, etc.)
    const enrichedReference = await this.fetchDesignMetadataUseCase.execute(
      designRef,
      workspaceId,
    );

    if (!enrichedReference) {
      this.logger.warn(`Refresh returned null for design reference ${referenceId}`);
      throw new BadRequestException('Failed to refresh design metadata');
    }

    // Update the reference with fresh metadata
    aec.updateDesignReferenceStatus(referenceId, {
      metadataFetchStatus: enrichedReference.metadataFetchStatus,
      metadataFetchError: enrichedReference.metadataFetchError,
      metadata: enrichedReference.metadata,
    });

    // Save
    await this.aecRepository.save(aec);

    this.logger.log(`✓ Refreshed metadata for design reference ${referenceId} in ticket ${ticketId}`);

    return {
      designReference: enrichedReference,
    };
  }
}
