/**
 * BulkCreateFromBreakdownUseCase
 *
 * Creates multiple draft tickets from a PRD breakdown result.
 * Each ticket is created as a draft AEC without tech spec.
 * Users can then enrich individual tickets through the normal flow.
 */

import { Injectable, BadRequestException, Logger, Inject, ForbiddenException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { CreateTicketUseCase } from './CreateTicketUseCase';
import { WORKSPACE_REPOSITORY, WorkspaceRepository } from '../../../workspaces/application/ports/WorkspaceRepository';

/**
 * Single ticket from breakdown to create
 */
export interface BreakdownTicketToCreate {
  epicName: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  acceptanceCriteria: string; // JSON stringified array of BDD criteria
}

/**
 * Command for bulk creation
 */
export interface BulkCreateCommand {
  workspaceId: string;
  userEmail: string;
  userId: string; // Firebase UID for workspace ownership verification
  tickets: BreakdownTicketToCreate[];
}

/**
 * Result of bulk creation
 *
 * Uses originalIndex to maintain mapping even when tickets fail.
 * This prevents order shifting when early tickets fail creation.
 */
export interface BulkCreateResult {
  results: Array<{
    originalIndex: number;  // Position in original request (0, 1, 2)
    title: string;          // Ticket title for reference
    ticketId?: string;      // Created ticket ID (if successful)
    error?: string;         // Error message (if failed)
  }>;
}

/**
 * Legacy format (deprecated, kept for backward compatibility)
 */
export interface BulkCreateResultLegacy {
  createdCount: number;
  ticketIds: string[];
  errors: Array<{
    ticketTitle: string;
    error: string;
  }>;
}

@Injectable()
export class BulkCreateFromBreakdownUseCase {
  private readonly logger = new Logger(BulkCreateFromBreakdownUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly createTicketUseCase: CreateTicketUseCase,
  ) {}

  /**
   * Execute bulk creation
   *
   * Creates multiple tickets as draft AECs.
   * Best-effort approach: if some fail, others still get created.
   *
   * @param command Contains workspace, user, and list of tickets to create
   * @returns Result with created IDs and any errors
   */
  async execute(command: BulkCreateCommand): Promise<BulkCreateResult> {
    this.logger.log(
      `📦 Starting bulk creation of ${command.tickets.length} tickets for ${command.userEmail}`,
    );

    // CRITICAL FIX #3: Verify workspace isolation
    const workspace = await this.workspaceRepository.findById(command.workspaceId);
    if (!workspace) {
      throw new BadRequestException(`Workspace "${command.workspaceId}" not found`);
    }

    if (workspace.ownerId !== command.userId) {
      throw new ForbiddenException(
        'User does not have permission to create tickets in this workspace',
      );
    }

    if (!command.tickets || command.tickets.length === 0) {
      throw new BadRequestException('No tickets provided for bulk creation');
    }

    if (command.tickets.length > 100) {
      throw new BadRequestException(
        'Bulk creation limit is 100 tickets. Please split into multiple requests.',
      );
    }

    const results: BulkCreateResult['results'] = [];

    // Create tickets sequentially (could be parallelized if needed)
    for (let i = 0; i < command.tickets.length; i++) {
      const ticket = command.tickets[i];
      try {
        const aec = await this.createTicketUseCase.execute({
          workspaceId: command.workspaceId,
          userEmail: command.userEmail,
          title: ticket.title,
          description: this.buildDescription(ticket),
          type: ticket.type,
          priority: ticket.priority,
        });

        // Parse and set acceptance criteria
        if (ticket.acceptanceCriteria) {
          try {
            const criteria = JSON.parse(ticket.acceptanceCriteria);

            // CRITICAL FIX #1: Validate BDD structure
            if (!Array.isArray(criteria)) {
              throw new BadRequestException(
                `Invalid acceptance criteria format for "${ticket.title}": must be an array`,
              );
            }

            // Validate each criterion has required fields
            const invalidIndices = criteria
              .map((c: any, idx: number) => ({ c, idx }))
              .filter(({ c }) => !c.given?.trim() || !c.when?.trim() || !c.then?.trim())
              .map(({ idx }) => idx);

            if (invalidIndices.length > 0) {
              throw new BadRequestException(
                `Invalid BDD criteria in "${ticket.title}": criterion(s) at index ${invalidIndices.join(', ')} missing required fields (given, when, then)`,
              );
            }

            if (criteria.length > 0) {
              aec.updateAcceptanceCriteria(
                criteria.map((c: any) =>
                  `Given ${c.given}\nWhen ${c.when}\nThen ${c.then}`,
                ),
              );
            }
          } catch (e) {
            // Re-throw BadRequestException (validation errors)
            if (e instanceof BadRequestException) {
              throw e;
            }
            // Convert parse errors to BadRequestException
            throw new BadRequestException(
              `Failed to parse acceptance criteria for "${ticket.title}": ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
        }

        // Set epic name as a tag/marker in description if needed
        // (Could extend AEC model to have epicName field if desired)

        // Save updated AEC
        await this.aecRepository.save(aec);

        // Track success with original index
        results.push({
          originalIndex: i,
          title: ticket.title,
          ticketId: aec.id,
        });
        this.logger.log(
          `✅ Created ticket ${i + 1}/${command.tickets.length}: ${ticket.title} (${aec.id})`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Track failure with original index
        results.push({
          originalIndex: i,
          title: ticket.title,
          error: message,
        });
        this.logger.error(
          `❌ Failed to create ticket ${i + 1}/${command.tickets.length} (${ticket.title}): ${message}`,
        );
        // Continue with next ticket (best-effort)
      }
    }

    const createdCount = results.filter((r) => r.ticketId).length;
    const errorCount = results.filter((r) => r.error).length;

    const result: BulkCreateResult = { results };

    this.logger.log(
      `📦 Bulk creation complete: ${createdCount}/${command.tickets.length} tickets created${
        errorCount > 0 ? `, ${errorCount} errors` : ''
      }`,
    );

    return result;
  }

  /**
   * Build ticket description from breakdown data
   */
  private buildDescription(ticket: BreakdownTicketToCreate): string {
    const lines: string[] = [];

    // Add epic info if present
    if (ticket.epicName) {
      lines.push(`**Epic:** ${ticket.epicName}`);
      lines.push('');
    }

    // Add description
    lines.push(ticket.description);

    return lines.join('\n');
  }
}
