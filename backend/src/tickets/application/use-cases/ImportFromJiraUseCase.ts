import { Injectable, Inject, Logger } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { AEC } from '../../domain/aec/AEC';
import { JiraTokenService } from '../../../jira/application/services/jira-token.service';
import { JiraApiClient } from '../../../jira/application/services/jira-api-client';
import {
  JiraIntegrationRepository,
  JIRA_INTEGRATION_REPOSITORY,
} from '../../../jira/domain/JiraIntegrationRepository';
import { TicketPriority, TicketType } from '../../domain/value-objects/AECStatus';

interface ImportFromJiraCommand {
  workspaceId: string;
  userId: string;
  issueKey: string;
}

export interface ImportFromJiraResult {
  ticketId: string;
  title: string;
  description?: string;
  type: TicketType;
  priority: TicketPriority;
  importedFrom: {
    platform: 'jira';
    issueId: string;
    issueUrl: string;
  };
}

/**
 * Maps Jira priority name to Forge priority.
 * Jira default priorities: Lowest, Low, Medium, High, Highest
 */
function mapJiraPriority(jiraPriority?: string): TicketPriority | null {
  if (!jiraPriority) return null;

  const lowerPriority = jiraPriority.toLowerCase();
  if (lowerPriority === 'highest') return 'urgent';
  if (lowerPriority === 'high') return 'high';
  if (lowerPriority === 'medium') return 'medium';
  if (lowerPriority === 'low' || lowerPriority === 'lowest') return 'low';

  return null;
}

/**
 * Maps Jira issue type to Forge ticket type.
 */
function mapJiraIssueType(jiraIssueType?: string): TicketType | null {
  if (!jiraIssueType) return null;

  const lowerType = jiraIssueType.toLowerCase();
  if (lowerType === 'bug') return 'bug';
  if (lowerType === 'story' || lowerType === 'epic') return 'feature';
  if (lowerType === 'task' || lowerType === 'sub-task') return 'task';

  return 'task'; // Default to task
}

/**
 * Convert Atlassian Document Format (ADF) to markdown.
 * Handles basic nodes: paragraph, heading, list, code block.
 */
function adfToMarkdown(adf: any): string {
  if (!adf?.content) return '';

  const lines: string[] = [];

  for (const node of adf.content) {
    if (node.type === 'paragraph') {
      const text = extractTextFromNode(node);
      if (text.trim()) lines.push(text);
    } else if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const text = extractTextFromNode(node);
      lines.push('#'.repeat(level) + ' ' + text);
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      const isOrdered = node.type === 'orderedList';
      let itemIndex = 1;

      for (const item of node.content || []) {
        const itemText = extractTextFromNode(item);
        const prefix = isOrdered ? `${itemIndex}. ` : '- ';
        lines.push(prefix + itemText);
        itemIndex++;
      }
    } else if (node.type === 'codeBlock') {
      const lang = node.attrs?.language || '';
      const code = extractTextFromNode(node);
      lines.push('```' + lang);
      lines.push(code);
      lines.push('```');
    }
  }

  return lines.join('\n\n');
}

/**
 * Extract text content from ADF node recursively.
 */
function extractTextFromNode(node: any): string {
  if (node.type === 'text') {
    return node.text || '';
  }
  if (node.content) {
    return node.content.map((n: any) => extractTextFromNode(n)).join('');
  }
  return '';
}

@Injectable()
export class ImportFromJiraUseCase {
  private readonly logger = new Logger(ImportFromJiraUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    @Inject(JIRA_INTEGRATION_REPOSITORY)
    private readonly jiraIntegrationRepo: JiraIntegrationRepository,
    private readonly tokenService: JiraTokenService,
    private readonly apiClient: JiraApiClient,
  ) {}

  async execute(command: ImportFromJiraCommand): Promise<ImportFromJiraResult> {
    // Check Jira integration exists
    const integration = await this.jiraIntegrationRepo.findByUserAndWorkspace(
      command.userId,
      command.workspaceId,
    );
    if (!integration) {
      throw new Error('Jira not connected. Connect Jira in Settings.');
    }

    // Validate issue key format
    if (!/^[A-Z]+-\d+$/.test(command.issueKey)) {
      throw new Error('Invalid Jira issue key format. Expected format: PROJECT-123');
    }

    // Decrypt API token
    const apiToken = await this.tokenService.decryptToken(integration.apiToken);

    // Fetch Jira issue
    let jiraIssue;
    try {
      jiraIssue = await this.apiClient.getIssue(
        integration.jiraUrl,
        integration.username,
        apiToken,
        command.issueKey,
      );
    } catch (error: any) {
      const message = error.message || String(error);

      if (message.includes('404') || message.includes('not found')) {
        throw new Error(`Jira issue ${command.issueKey} not found`);
      }
      if (message.includes('403') || message.includes('permission')) {
        throw new Error(`No permission to access Jira issue ${command.issueKey}`);
      }

      this.logger.error(`Failed to fetch Jira issue: ${message}`);
      throw new Error('Failed to fetch Jira issue');
    }

    // Map fields
    const title = jiraIssue.summary;
    const description = jiraIssue.description ? adfToMarkdown(jiraIssue.description) : undefined;
    const priority = mapJiraPriority(jiraIssue.priority);
    const type = mapJiraIssueType(jiraIssue.issueType);

    // Create draft AEC
    const aec = AEC.createDraft(
      command.workspaceId,
      command.userId,
      title,
      description ?? undefined,
      undefined,
      type ?? undefined,
      priority ?? undefined,
    );

    // Set import metadata
    const issueUrl = `${integration.jiraUrl}/browse/${jiraIssue.key}`;
    aec.setImportedFrom({
      platform: 'jira',
      issueId: jiraIssue.key,
      issueUrl,
    });

    // Save to repository
    await this.aecRepository.save(aec);

    this.logger.log(`Successfully imported Jira issue ${command.issueKey} as ticket ${aec.id}`);

    return {
      ticketId: aec.id,
      title,
      description,
      type: type ?? 'task',
      priority: priority ?? 'medium',
      importedFrom: {
        platform: 'jira',
        issueId: jiraIssue.key,
        issueUrl,
      },
    };
  }
}
