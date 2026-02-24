import { Injectable, Inject, Logger } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { AEC } from '../../domain/aec/AEC';
import { LinearTokenService } from '../../../linear/application/services/linear-token.service';
import { LinearApiClient } from '../../../linear/application/services/linear-api-client';
import {
  LinearIntegrationRepository,
  LINEAR_INTEGRATION_REPOSITORY,
} from '../../../linear/domain/LinearIntegrationRepository';
import { TicketPriority } from '../../domain/value-objects/AECStatus';

interface ImportFromLinearCommand {
  teamId: string;
  userId: string;
  issueId: string;
}

export interface ImportFromLinearResult {
  ticketId: string;
  title: string;
  description?: string;
  type: 'task'; // Linear issues always map to task
  priority: TicketPriority;
  importedFrom: {
    platform: 'linear';
    issueId: string;
    issueUrl: string;
  };
}

/**
 * Maps Linear priority (0-4) to Forge priority.
 * Linear priorities: 0 (None), 1 (Urgent), 2 (High), 3 (Medium), 4 (Low)
 */
function mapLinearPriority(linearPriority?: number): TicketPriority | null {
  if (linearPriority === undefined || linearPriority === null) return null;

  switch (linearPriority) {
    case 1:
      return 'urgent';
    case 2:
      return 'high';
    case 3:
      return 'medium';
    case 4:
    case 0:
      return 'low';
    default:
      return 'medium';
  }
}

@Injectable()
export class ImportFromLinearUseCase {
  private readonly logger = new Logger(ImportFromLinearUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(LINEAR_INTEGRATION_REPOSITORY)
    private readonly linearIntegrationRepo: LinearIntegrationRepository,
    private readonly tokenService: LinearTokenService,
    private readonly apiClient: LinearApiClient,
  ) {}

  async execute(command: ImportFromLinearCommand): Promise<ImportFromLinearResult> {
    // Check Linear integration exists
    const integration = await this.linearIntegrationRepo.findByWorkspaceId(command.teamId);
    if (!integration) {
      throw new Error('Linear not connected. Connect Linear in Settings.');
    }

    // Decrypt access token
    const accessToken = await this.tokenService.decryptToken(integration.accessToken);

    // Fetch Linear issue
    let linearIssue;
    try {
      linearIssue = await this.apiClient.getIssue(accessToken, command.issueId);
    } catch (error: any) {
      const message = error.message || String(error);

      if (message.includes('not found')) {
        throw new Error(`Linear issue ${command.issueId} not found`);
      }
      if (message.includes('No access') || message.includes('permission')) {
        throw new Error(`No access to Linear issue ${command.issueId}`);
      }

      this.logger.error(`Failed to fetch Linear issue: ${message}`);
      throw new Error('Failed to fetch Linear issue');
    }

    // Map fields
    const title = linearIssue.title;
    const description = linearIssue.description || undefined;
    const priority = mapLinearPriority(linearIssue.priority);

    // Create draft AEC (Linear issues always map to task type)
    const aec = AEC.createDraft(
      command.teamId,
      command.userId,
      title,
      description ?? undefined,
      undefined,
      'task',
      priority ?? undefined,
    );

    // Set import metadata
    aec.setImportedFrom({
      platform: 'linear',
      issueId: linearIssue.identifier,
      issueUrl: linearIssue.url,
    });

    // Save to repository
    await this.aecRepository.save(aec);

    this.logger.log(`Successfully imported Linear issue ${linearIssue.identifier} as ticket ${aec.id}`);

    return {
      ticketId: aec.id,
      title,
      description,
      type: 'task',
      priority: priority ?? 'medium',
      importedFrom: {
        platform: 'linear',
        issueId: linearIssue.identifier,
        issueUrl: linearIssue.url,
      },
    };
  }
}
