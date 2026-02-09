import { Injectable, Logger } from '@nestjs/common';

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearIssueResult {
  id: string;
  identifier: string;
  title: string;
  url: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority?: number;
  url: string;
}

@Injectable()
export class LinearApiClient {
  private readonly logger = new Logger(LinearApiClient.name);
  private readonly endpoint = 'https://api.linear.app/graphql';

  private async graphql(accessToken: string, query: string, variables?: Record<string, any>): Promise<any> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Linear GraphQL request failed: ${response.statusText}`);
    }

    const result = (await response.json()) as any;
    if (result.errors?.length) {
      throw new Error(`Linear GraphQL error: ${result.errors[0].message}`);
    }

    return result.data;
  }

  async getTeams(accessToken: string): Promise<LinearTeam[]> {
    const data = await this.graphql(accessToken, `
      query {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `);

    return data.teams.nodes;
  }

  async createIssue(
    accessToken: string,
    input: {
      teamId: string;
      title: string;
      description?: string;
      priority?: number;
      estimate?: number;
    },
  ): Promise<LinearIssueResult> {
    const data = await this.graphql(
      accessToken,
      `
        mutation IssueCreate($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              identifier
              title
              url
            }
          }
        }
      `,
      { input },
    );

    if (!data.issueCreate.success) {
      throw new Error('Failed to create Linear issue');
    }

    return data.issueCreate.issue;
  }

  async updateIssue(
    accessToken: string,
    issueId: string,
    input: {
      title?: string;
      description?: string;
      priority?: number;
      stateId?: string;
    },
  ): Promise<LinearIssueResult> {
    const data = await this.graphql(
      accessToken,
      `
        mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) {
            success
            issue {
              id
              identifier
              title
              url
            }
          }
        }
      `,
      { id: issueId, input },
    );

    if (!data.issueUpdate.success) {
      throw new Error('Failed to update Linear issue');
    }

    return data.issueUpdate.issue;
  }

  async getIssue(accessToken: string, issueId: string): Promise<LinearIssue> {
    const data = await this.graphql(
      accessToken,
      `
        query GetIssue($issueId: String!) {
          issue(id: $issueId) {
            id
            identifier
            title
            description
            priority
            url
          }
        }
      `,
      { issueId },
    );

    if (!data.issue) {
      throw new Error(`Linear issue ${issueId} not found`);
    }

    return data.issue;
  }

  async getViewer(accessToken: string): Promise<{ id: string; name: string; email: string }> {
    const data = await this.graphql(accessToken, '{ viewer { id name email } }');
    return data.viewer;
  }

  /**
   * Search for Linear issues by identifier or title
   * Used for autocomplete in import wizard
   */
  async searchIssues(
    accessToken: string,
    query: string,
  ): Promise<Array<{ id: string; identifier: string; title: string }>> {
    try {
      const data = await this.graphql(
        accessToken,
        `
          query SearchIssues($filter: IssueFilter!) {
            issues(filter: $filter, first: 20) {
              nodes {
                id
                identifier
                title
              }
            }
          }
        `,
        {
          filter: {
            or: [
              { identifier: { contains: query } },
              { title: { contains: query } },
            ],
          },
        },
      );

      return data.issues.nodes || [];
    } catch (error: any) {
      this.logger.warn(`Failed to search Linear issues: ${error.message}`);
      return []; // Return empty list on error
    }
  }
}
