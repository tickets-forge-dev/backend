import { Injectable } from '@nestjs/common';
import { PostHogService } from './posthog.service';
import type {
  AgentExecutionProperties,
  DeepAnalysisProperties,
  CostTrackingProperties,
} from '@repo/shared-types';

/**
 * Telemetry Service
 *
 * High-level analytics tracking for Forge operations
 * Provides semantic methods for tracking specific business events
 */
@Injectable()
export class TelemetryService {
  constructor(private posthog: PostHogService) {}

  /**
   * Track ticket creation flow
   */
  trackTicketCreationStarted(userId: string, workspaceId: string, mode: 'create_new' | 'import') {
    this.posthog.capture(userId, 'ticket_creation_started', {
      workspace_id: workspaceId,
      mode,
    });
  }

  /**
   * Track repository selection
   */
  trackRepositorySelected(userId: string, repository: string) {
    this.posthog.capture(userId, 'repository_selected', {
      repository,
    });
  }

  /**
   * Track deep analysis execution
   */
  trackDeepAnalysisStarted(
    userId: string,
    ticketId: string,
    repository: string,
  ) {
    this.posthog.capture(userId, 'deep_analysis_started', {
      ticket_id: ticketId,
      repository,
    });
  }

  /**
   * Track deep analysis completion
   */
  trackDeepAnalysisCompleted(
    userId: string,
    props: DeepAnalysisProperties,
  ) {
    this.posthog.capture(userId, 'deep_analysis_completed', props);
  }

  /**
   * Track deep analysis failure
   */
  trackDeepAnalysisFailed(
    userId: string,
    ticketId: string,
    error: string,
    duration_ms: number,
  ) {
    this.posthog.capture(userId, 'deep_analysis_failed', {
      ticket_id: ticketId,
      error,
      duration_ms,
    });
  }

  /**
   * Track question generation
   */
  trackQuestionsGenerated(userId: string, ticketId: string, count: number) {
    this.posthog.capture(userId, 'questions_shown', {
      ticket_id: ticketId,
      question_count: count,
    });
  }

  /**
   * Track question answering
   */
  trackQuestionAnswered(userId: string, ticketId: string, questionIndex: number) {
    this.posthog.capture(userId, 'question_answered', {
      ticket_id: ticketId,
      question_index: questionIndex,
    });
  }

  /**
   * Track tech spec generation
   */
  trackSpecGenerated(userId: string, ticketId: string, qualityScore: number, duration_ms: number) {
    this.posthog.capture(userId, 'ticket_spec_generated', {
      ticket_id: ticketId,
      quality_score: qualityScore,
      duration_ms,
    });
  }

  /**
   * Track ticket finalization
   */
  trackTicketFinalized(
    userId: string,
    ticketId: string,
    totalDuration_ms: number,
    totalCost_usd: number,
  ) {
    this.posthog.capture(userId, 'ticket_finalized', {
      ticket_id: ticketId,
      total_duration_ms: totalDuration_ms,
      total_cost_usd: totalCost_usd,
    });
  }

  /**
   * Track agent execution
   */
  trackAgentExecution(userId: string, props: AgentExecutionProperties) {
    this.posthog.capture(userId, 'agent_execution_completed', props);
  }

  /**
   * Track cost (LLM tokens, API calls)
   */
  trackCost(userId: string, props: CostTrackingProperties) {
    this.posthog.capture(userId, 'cost_tracked', props);
  }

  /**
   * Track Jira integration events
   */
  trackJiraIssueSearched(userId: string, query: string) {
    this.posthog.capture(userId, 'jira_issue_searched', { query });
  }

  trackJiraIssueImported(userId: string, issueKey: string, ticketId: string) {
    this.posthog.capture(userId, 'jira_issue_imported', {
      issue_key: issueKey,
      ticket_id: ticketId,
    });
  }

  trackJiraConnected(userId: string, jiraUrl: string) {
    this.posthog.capture(userId, 'integration_connected', {
      integration: 'jira',
      jira_url: jiraUrl,
    });
  }

  /**
   * Track Linear integration events
   */
  trackLinearIssueSearched(userId: string, query: string) {
    this.posthog.capture(userId, 'linear_issue_searched', { query });
  }

  trackLinearIssueImported(userId: string, issueIdentifier: string, ticketId: string) {
    this.posthog.capture(userId, 'linear_issue_imported', {
      issue_identifier: issueIdentifier,
      ticket_id: ticketId,
    });
  }

  trackLinearConnected(userId: string, teamId: string) {
    this.posthog.capture(userId, 'integration_connected', {
      integration: 'linear',
      team_id: teamId,
    });
  }

  /**
   * Set user properties (traits)
   */
  setUserProperties(userId: string, properties: Record<string, any>) {
    this.posthog.setUserProperties(userId, properties);
  }
}
