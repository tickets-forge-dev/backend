import { Injectable, Inject, Logger } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { LinearTokenService } from '../../../linear/application/services/linear-token.service';
import { LinearApiClient } from '../../../linear/application/services/linear-api-client';
import {
  LinearIntegrationRepository,
  LINEAR_INTEGRATION_REPOSITORY,
} from '../../../linear/domain/LinearIntegrationRepository';
import { TechSpecMarkdownGenerator } from '../services/TechSpecMarkdownGenerator';

interface ExportToLinearCommand {
  aecId: string;
  workspaceId: string;
  teamId: string;
}

// Map Forge priority to Linear priority (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low)
const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4,
};

@Injectable()
export class ExportToLinearUseCase {
  private readonly logger = new Logger(ExportToLinearUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(LINEAR_INTEGRATION_REPOSITORY)
    private readonly linearIntegrationRepo: LinearIntegrationRepository,
    private readonly tokenService: LinearTokenService,
    private readonly apiClient: LinearApiClient,
    private readonly markdownGenerator: TechSpecMarkdownGenerator,
  ) {}

  async execute(command: ExportToLinearCommand): Promise<{ issueId: string; issueUrl: string; identifier: string }> {
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec || aec.workspaceId !== command.workspaceId) {
      throw new Error('Ticket not found');
    }

    if (!aec.techSpec) {
      throw new Error('Ticket has no tech spec. Generate a spec first.');
    }

    const integration = await this.linearIntegrationRepo.findByWorkspaceId(command.workspaceId);
    if (!integration) {
      throw new Error('Linear not connected. Connect Linear in Settings.');
    }

    const accessToken = await this.tokenService.decryptToken(integration.accessToken);

    // Generate markdown description from tech spec
    const description = this.markdownGenerator.generate(aec);

    const priority = aec.priority ? PRIORITY_MAP[aec.priority] ?? 0 : 0;

    // Check if already exported (update instead of create)
    const existingIssue = aec.externalIssue;
    if (existingIssue?.platform === 'linear' && existingIssue.issueId) {
      this.logger.log(`Updating existing Linear issue ${existingIssue.issueId}`);
      const issue = await this.apiClient.updateIssue(accessToken, existingIssue.issueId, {
        title: aec.title,
        description,
        priority,
      });

      return {
        issueId: issue.id,
        issueUrl: issue.url,
        identifier: issue.identifier,
      };
    }

    // Create new issue
    const issue = await this.apiClient.createIssue(accessToken, {
      teamId: command.teamId,
      title: aec.title,
      description,
      priority,
    });

    // Save external issue reference
    aec.setExternalIssue({
      platform: 'linear',
      issueId: issue.id,
      issueUrl: issue.url,
    });
    await this.aecRepository.save(aec);

    this.logger.log(`Exported to Linear: ${issue.identifier} (${issue.url})`);

    return {
      issueId: issue.id,
      issueUrl: issue.url,
      identifier: issue.identifier,
    };
  }
}
