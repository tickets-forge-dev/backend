import { Injectable, Inject, Logger } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { JiraTokenService } from '../../../jira/application/services/jira-token.service';
import { JiraApiClient } from '../../../jira/application/services/jira-api-client';
import {
  JiraIntegrationRepository,
  JIRA_INTEGRATION_REPOSITORY,
} from '../../../jira/domain/JiraIntegrationRepository';
import { TechSpecMarkdownGenerator } from '../services/TechSpecMarkdownGenerator';
import { AECSerializer } from '../services/AECSerializer';
import { TechSpecSerializer } from '../services/TechSpecSerializer';

interface ExportToJiraCommand {
  aecId: string;
  workspaceId: string;
  userId: string;
  projectKey: string;
  sections?: string[];
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
    private readonly aecSerializer: AECSerializer,
    private readonly techSpecSerializer: TechSpecSerializer,
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

    // Generate comprehensive markdown description with all ticket sections
    // Includes: Problem Statement, Solution, Acceptance Criteria, File Changes,
    // API Endpoints, Test Plan, and Scope (In/Out)
    const description = this.markdownGenerator.generate(aec, command.sections);

    const priority = aec.priority ? PRIORITY_MAP[aec.priority] : undefined;

    // Always create a new Jira issue (don't update existing ones)
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

    // Upload tech spec as markdown file attachment
    try {
      const techSpecFileName = `${aec.id}_tech-spec.md`;
      const techSpecContent = Buffer.from(description, 'utf-8');
      await this.apiClient.uploadAttachment(
        integration.jiraUrl,
        integration.username,
        apiToken,
        issue.key,
        techSpecFileName,
        techSpecContent,
      );
      this.logger.log(`Uploaded tech spec markdown file to Jira issue ${issue.key}`);
    } catch (error: any) {
      // Log but don't fail if attachment upload fails
      this.logger.error(`Failed to upload tech spec markdown file: ${error.message}`);
    }

    // Upload AEC.xml serialization (full domain object)
    let aecXmlUploaded = false;
    try {
      const aecXmlFileName = `${aec.id}_aec.xml`;
      const aecXmlContent = this.aecSerializer.serialize(aec);
      this.logger.debug(`Generated AEC.xml (${aecXmlContent.length} bytes)`);
      const aecXmlBuffer = Buffer.from(aecXmlContent, 'utf-8');
      await this.apiClient.uploadAttachment(
        integration.jiraUrl,
        integration.username,
        apiToken,
        issue.key,
        aecXmlFileName,
        aecXmlBuffer,
      );
      aecXmlUploaded = true;
      this.logger.log(`✓ Uploaded ${aecXmlFileName} to Jira issue ${issue.key}`);
    } catch (error: any) {
      // Log but don't fail if attachment upload fails
      this.logger.error(`✗ Failed to upload AEC.xml: ${error.message}`, error.stack);
    }

    // Upload tech-spec file (JSON format with structured data)
    let techSpecUploaded = false;
    try {
      const techSpecFileName = `${aec.id}_tech-spec.json`;
      const techSpecContent = this.techSpecSerializer.serialize(aec.techSpec);
      this.logger.debug(`Generated tech-spec.json (${techSpecContent.length} bytes)`);
      const techSpecBuffer = Buffer.from(techSpecContent, 'utf-8');
      await this.apiClient.uploadAttachment(
        integration.jiraUrl,
        integration.username,
        apiToken,
        issue.key,
        techSpecFileName,
        techSpecBuffer,
      );
      techSpecUploaded = true;
      this.logger.log(`✓ Uploaded ${techSpecFileName} to Jira issue ${issue.key}`);
    } catch (error: any) {
      // Log but don't fail if attachment upload fails
      this.logger.error(`✗ Failed to upload tech-spec.json: ${error.message}`, error.stack);
    }

    // Log summary
    this.logger.log(`Export complete: ${aecXmlUploaded ? '✓' : '✗'} AEC.xml, ${techSpecUploaded ? '✓' : '✗'} tech-spec.json, ✓ tech-spec.md`);

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
