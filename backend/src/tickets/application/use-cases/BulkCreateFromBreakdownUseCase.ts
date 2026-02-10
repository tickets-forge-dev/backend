/**
 * BulkCreateFromBreakdownUseCase
 *
 * Creates multiple draft tickets from a PRD breakdown result.
 * Each ticket is created as a draft AEC without tech spec.
 * Users can then enrich individual tickets through the normal flow.
 */

import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { CreateTicketUseCase } from './CreateTicketUseCase';
import { AEC } from '../../domain/aec/AEC';

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
  tickets: BreakdownTicketToCreate[];
}

/**
 * Result of bulk creation
 */
export interface BulkCreateResult {
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

    if (!command.tickets || command.tickets.length === 0) {
      throw new BadRequestException('No tickets provided for bulk creation');
    }

    if (command.tickets.length > 100) {
      throw new BadRequestException(
        'Bulk creation limit is 100 tickets. Please split into multiple requests.',
      );
    }

    const createdTickets: Array<{ id: string; title: string }> = [];
    const errors: Array<{ ticketTitle: string; error: string }> = [];

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
            if (Array.isArray(criteria) && criteria.length > 0) {
              aec.updateAcceptanceCriteria(
                criteria.map((c: any) =>
                  `Given ${c.given}\nWhen ${c.when}\nThen ${c.then}`,
                ),
              );
            }
          } catch (e) {
            this.logger.warn(
              `Failed to parse AC for ticket ${ticket.title}: ${e}`,
            );
          }
        }

        // Set epic name as a tag/marker in description if needed
        // (Could extend AEC model to have epicName field if desired)

        // Save updated AEC
        await this.aecRepository.save(aec);

        createdTickets.push({ id: aec.id, title: ticket.title });
        this.logger.log(
          `✅ Created ticket ${i + 1}/${command.tickets.length}: ${ticket.title} (${aec.id})`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          ticketTitle: ticket.title,
          error: message,
        });
        this.logger.error(
          `❌ Failed to create ticket ${i + 1}/${command.tickets.length} (${ticket.title}): ${message}`,
        );
        // Continue with next ticket (best-effort)
      }
    }

    const result: BulkCreateResult = {
      createdCount: createdTickets.length,
      ticketIds: createdTickets.map((t) => t.id),
      errors,
    };

    this.logger.log(
      `📦 Bulk creation complete: ${result.createdCount}/${command.tickets.length} tickets created${
        errors.length > 0 ? `, ${errors.length} errors` : ''
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
