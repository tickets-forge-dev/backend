import { Injectable, Inject, Logger } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { JiraTokenService } from '../../../jira/application/services/jira-token.service';
import { JiraApiClient } from '../../../jira/application/services/jira-api-client';
import {
  JiraIntegrationRepository,
  JIRA_INTEGRATION_REPOSITORY,
} from '../../../jira/domain/JiraIntegrationRepository';
import { TechSpecMarkdownGenerator } from '../services/TechSpecMarkdownGenerator';

interface ExportToJiraCommand {
  aecId: string;
  workspaceId: string;
  userId: string;
  projectKey: string;
}

// Map Forge priority to Jira priority names
const PRIORITY_MAP: Record<string, string> = {
  urgent: 'Highest',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

@Injectable()
export class ExportToJiraUseCase {
  private readonly logger = new Logger(ExportToJiraUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(JIRA_INTEGRATION_REPOSITORY)
    private readonly jiraIntegrationRepo: JiraIntegrationRepository,
    private readonly tokenService: JiraTokenService,
    private readonly apiClient: JiraApiClient,
    private readonly markdownGenerator: TechSpecMarkdownGenerator,
  ) {}

  async execute(command: ExportToJiraCommand): Promise<{ issueId: string; issueKey: string; issueUrl: string }> {
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec || aec.workspaceId !== command.workspaceId) {
      throw new Error('Ticket not found');
    }

    if (!aec.techSpec) {
      throw new Error('Ticket has no tech spec. Generate a spec first.');
    }

    const integration = await this.jiraIntegrationRepo.findByUserAndWorkspace(
      command.userId,
      command.workspaceId,
    );
    if (!integration) {
      throw new Error('Jira not connected. Connect Jira in Settings.');
    }

    const apiToken = await this.tokenService.decryptToken(integration.apiToken);

    // Generate markdown description from tech spec
    const description = this.markdownGenerator.generate(aec);

    const priority = aec.priority ? PRIORITY_MAP[aec.priority] : undefined;

    // Check if already exported to Jira (update instead of create)
    const existingIssue = aec.externalIssue;
    if (existingIssue?.platform === 'jira' && existingIssue.issueId) {
      this.logger.log(`Updating existing Jira issue ${existingIssue.issueId}`);
      await this.apiClient.updateIssue(
        integration.jiraUrl,
        integration.username,
        apiToken,
        existingIssue.issueId,
        {
          summary: aec.title,
          description,
          priority,
        },
      );

      return {
        issueId: existingIssue.issueId,
        issueKey: existingIssue.issueId,
        issueUrl: existingIssue.issueUrl,
      };
    }

    // Create new issue
    const issue = await this.apiClient.createIssue(
      integration.jiraUrl,
      integration.username,
      apiToken,
      {
        projectKey: command.projectKey,
        summary: aec.title,
        description,
        priority,
      },
    );

    const issueUrl = `${integration.jiraUrl}/browse/${issue.key}`;

    // Save external issue reference
    aec.setExternalIssue({
      platform: 'jira',
      issueId: issue.key,
      issueUrl,
    });
    await this.aecRepository.save(aec);

    this.logger.log(`Exported to Jira: ${issue.key} (${issueUrl})`);

    return {
      issueId: issue.id,
      issueKey: issue.key,
      issueUrl,
    };
  }
}
