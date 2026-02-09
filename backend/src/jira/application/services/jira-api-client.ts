import { Injectable, Logger } from '@nestjs/common';

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
}

export interface JiraIssueResult {
  id: string;
  key: string;
  self: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  summary: string;
  description: any; // ADF document
  priority?: string;
  issueType?: string;
}

interface CreateIssueInput {
  projectKey: string;
  summary: string;
  description: string;
  issueTypeName?: string;
  priority?: string;
}

interface UpdateIssueInput {
  summary?: string;
  description?: string;
  priority?: string;
}

@Injectable()
export class JiraApiClient {
  private readonly logger = new Logger(JiraApiClient.name);

  private buildAuth(username: string, apiToken: string): string {
    return `Basic ${Buffer.from(`${username}:${apiToken}`).toString('base64')}`;
  }

  private buildApiUrl(jiraUrl: string, path: string): string {
    return `${jiraUrl}/rest/api/3/${path}`;
  }

  async getProjects(jiraUrl: string, username: string, apiToken: string): Promise<JiraProject[]> {
    const url = this.buildApiUrl(jiraUrl, 'project');
    const response = await fetch(url, {
      headers: {
        Authorization: this.buildAuth(username, apiToken),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch Jira projects: ${response.status} ${text}`);
    }

    const data = (await response.json()) as any[];
    return data.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
    }));
  }

  async getIssueTypes(jiraUrl: string, username: string, apiToken: string, projectKey: string): Promise<JiraIssueType[]> {
    const url = this.buildApiUrl(jiraUrl, `project/${projectKey}`);
    const response = await fetch(url, {
      headers: {
        Authorization: this.buildAuth(username, apiToken),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Jira issue types: ${response.status}`);
    }

    const data = (await response.json()) as any;
    return (data.issueTypes || []).map((t: any) => ({
      id: t.id,
      name: t.name,
    }));
  }

  async createIssue(
    jiraUrl: string,
    username: string,
    apiToken: string,
    input: CreateIssueInput,
  ): Promise<JiraIssueResult> {
    const url = this.buildApiUrl(jiraUrl, 'issue');

    // Jira v3 uses ADF (Atlassian Document Format) for description
    const body: any = {
      fields: {
        project: { key: input.projectKey },
        summary: input.summary,
        description: this.markdownToAdf(input.description),
        issuetype: { name: input.issueTypeName || 'Task' },
      },
    };

    if (input.priority) {
      body.fields.priority = { name: input.priority };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.buildAuth(username, apiToken),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Jira create issue failed: ${response.status} ${text}`);
      throw new Error(`Failed to create Jira issue: ${response.status} ${text}`);
    }

    const data = (await response.json()) as any;
    return {
      id: data.id,
      key: data.key,
      self: data.self,
    };
  }

  async updateIssue(
    jiraUrl: string,
    username: string,
    apiToken: string,
    issueIdOrKey: string,
    input: UpdateIssueInput,
  ): Promise<void> {
    const url = this.buildApiUrl(jiraUrl, `issue/${issueIdOrKey}`);

    const fields: any = {};
    if (input.summary) fields.summary = input.summary;
    if (input.description) fields.description = this.markdownToAdf(input.description);
    if (input.priority) fields.priority = { name: input.priority };

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: this.buildAuth(username, apiToken),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to update Jira issue: ${response.status} ${text}`);
    }
  }

  async getIssue(
    jiraUrl: string,
    username: string,
    apiToken: string,
    issueKey: string,
  ): Promise<JiraIssue> {
    const url = this.buildApiUrl(jiraUrl, `issue/${issueKey}`);
    const response = await fetch(url, {
      headers: {
        Authorization: this.buildAuth(username, apiToken),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 404) {
        throw new Error(`Jira issue ${issueKey} not found`);
      }
      if (response.status === 403) {
        throw new Error(`No permission to access Jira issue ${issueKey}`);
      }
      throw new Error(`Failed to fetch Jira issue: ${response.status} ${text}`);
    }

    const data = (await response.json()) as any;
    return {
      id: data.id,
      key: data.key,
      self: data.self,
      summary: data.fields.summary,
      description: data.fields.description,
      priority: data.fields.priority?.name,
      issueType: data.fields.issuetype?.name,
    };
  }

  async verifyConnection(jiraUrl: string, username: string, apiToken: string): Promise<{ displayName: string; emailAddress: string }> {
    const url = this.buildApiUrl(jiraUrl, 'myself');
    const response = await fetch(url, {
      headers: {
        Authorization: this.buildAuth(username, apiToken),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Jira connection failed: ${response.status}. Check your URL, username, and API token.`);
    }

    const data = (await response.json()) as any;
    return {
      displayName: data.displayName,
      emailAddress: data.emailAddress,
    };
  }

  /**
   * Converts markdown text to a simple Jira ADF (Atlassian Document Format).
   * Handles headings, lists, code blocks, bold, and paragraphs.
   */
  private markdownToAdf(markdown: string): any {
    const lines = markdown.split('\n');
    const content: any[] = [];

    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLanguage = '';

    for (const line of lines) {
      // Code block start/end
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          content.push({
            type: 'codeBlock',
            attrs: { language: codeLanguage || 'text' },
            content: [{ type: 'text', text: codeLines.join('\n') }],
          });
          codeLines = [];
          codeLanguage = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Empty line
      if (line.trim() === '') continue;

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        content.push({
          type: 'heading',
          attrs: { level },
          content: [{ type: 'text', text: headingMatch[2] }],
        });
        continue;
      }

      // Table separator line
      if (line.match(/^\|[-\s|]+\|$/)) continue;

      // Table row
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.slice(1, -1).split('|').map((c) => c.trim());
        content.push({
          type: 'table',
          content: [{
            type: 'tableRow',
            content: cells.map((cell) => ({
              type: 'tableCell',
              content: [{ type: 'paragraph', content: this.parseInlineText(cell) }],
            })),
          }],
        });
        continue;
      }

      // Bullet list
      if (line.match(/^[-*]\s/)) {
        content.push({
          type: 'bulletList',
          content: [{
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: this.parseInlineText(line.replace(/^[-*]\s/, '')),
            }],
          }],
        });
        continue;
      }

      // Numbered list
      const numberedMatch = line.match(/^\d+\.\s(.+)$/);
      if (numberedMatch) {
        content.push({
          type: 'orderedList',
          content: [{
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: this.parseInlineText(numberedMatch[1]),
            }],
          }],
        });
        continue;
      }

      // Horizontal rule
      if (line.match(/^---+$/)) {
        content.push({ type: 'rule' });
        continue;
      }

      // Regular paragraph
      content.push({
        type: 'paragraph',
        content: this.parseInlineText(line),
      });
    }

    return {
      type: 'doc',
      version: 1,
      content,
    };
  }

  /** Parse inline markdown (bold, code, italic) into ADF text nodes */
  private parseInlineText(text: string): any[] {
    const nodes: any[] = [];
    const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      // Add plain text before this match
      if (match.index > lastIndex) {
        nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) });
      }

      if (match[2]) {
        // Bold
        nodes.push({ type: 'text', text: match[2], marks: [{ type: 'strong' }] });
      } else if (match[3]) {
        // Code
        nodes.push({ type: 'text', text: match[3], marks: [{ type: 'code' }] });
      }

      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < text.length) {
      nodes.push({ type: 'text', text: text.slice(lastIndex) });
    }

    if (nodes.length === 0) {
      nodes.push({ type: 'text', text: text || ' ' });
    }

    return nodes;
  }
}
