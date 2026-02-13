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
      source: 'backend',
      workspace_id: workspaceId,
      mode,
      timestamp: new Date().toISOString(),
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
    this.posthog.capture(userId, 'deep_analysis_completed', {
      source: 'backend',
      ...props,
      timestamp: new Date().toISOString(),
    });
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
   * Track LLM API call (token usage, cost, latency)
   * Used for: Claude API calls, deep analysis, spec generation, question generation
   */
  trackLLMCall(
    userId: string,
    ticketId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    costUsd: number,
    durationMs: number,
    purpose: 'deep_analysis' | 'spec_generation' | 'question_generation' | 'answer_refinement' | 'other',
  ) {
    this.posthog.capture(userId, 'llm_api_call', {
      source: 'backend',
      ticket_id: ticketId,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      cost_usd: costUsd,
      duration_ms: durationMs,
      purpose,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track LLM error
   */
  trackLLMError(
    userId: string,
    ticketId: string,
    model: string,
    error: string,
    durationMs: number,
    purpose: 'deep_analysis' | 'spec_generation' | 'question_generation' | 'answer_refinement' | 'other',
  ) {
    this.posthog.capture(userId, 'llm_api_error', {
      source: 'backend',
      ticket_id: ticketId,
      model,
      error,
      duration_ms: durationMs,
      purpose,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track cost (aggregated LLM tokens, API calls)
   */
  trackCost(userId: string, props: CostTrackingProperties) {
    this.posthog.capture(userId, 'cost_tracked', {
      source: 'backend',
      ...props,
    });
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
   * Track Figma OAuth flow events
   */
  trackFigmaOAuthStarted(userId: string, workspaceId: string) {
    this.posthog.capture(userId, 'oauth_figma_started', {
      workspace_id: workspaceId,
    });
  }

  trackFigmaOAuthSuccess(userId: string, workspaceId: string, duration_ms: number) {
    this.posthog.capture(userId, 'oauth_figma_success', {
      workspace_id: workspaceId,
      duration_ms,
    });
  }

  trackFigmaOAuthFailed(userId: string, workspaceId: string, error: string, duration_ms: number) {
    this.posthog.capture(userId, 'oauth_figma_failed', {
      workspace_id: workspaceId,
      error,
      duration_ms,
    });
  }

  /**
   * Track Loom OAuth flow events
   */
  trackLoomOAuthStarted(userId: string, workspaceId: string) {
    this.posthog.capture(userId, 'oauth_loom_started', {
      workspace_id: workspaceId,
    });
  }

  trackLoomOAuthSuccess(userId: string, workspaceId: string, duration_ms: number) {
    this.posthog.capture(userId, 'oauth_loom_success', {
      workspace_id: workspaceId,
      duration_ms,
    });
  }

  trackLoomOAuthFailed(userId: string, workspaceId: string, error: string, duration_ms: number) {
    this.posthog.capture(userId, 'oauth_loom_failed', {
      workspace_id: workspaceId,
      error,
      duration_ms,
    });
  }

  /**
   * Track design link operations (Phase 2 - Epic 26)
   */
  trackDesignLinkAdded(userId: string, ticketId: string, platform: string) {
    this.posthog.capture(userId, 'design_link_added', {
      source: 'backend',
      ticket_id: ticketId,
      platform, // 'figma', 'loom', 'miro', etc.
      timestamp: new Date().toISOString(),
    });
  }

  trackDesignLinkRemoved(userId: string, ticketId: string, platform: string) {
    this.posthog.capture(userId, 'design_link_removed', {
      source: 'backend',
      ticket_id: ticketId,
      platform,
      timestamp: new Date().toISOString(),
    });
  }

  trackDesignMetadataFetched(userId: string, ticketId: string, platform: string, durationMs: number, success: boolean) {
    this.posthog.capture(userId, 'design_metadata_fetched', {
      source: 'backend',
      ticket_id: ticketId,
      platform,
      duration_ms: durationMs,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track PRD breakdown operations
   */
  trackPRDBreakdownStarted(userId: string, workspaceId: string) {
    this.posthog.capture(userId, 'prd_breakdown_started', {
      source: 'backend',
      workspace_id: workspaceId,
      timestamp: new Date().toISOString(),
    });
  }

  trackPRDBreakdownCompleted(userId: string, workspaceId: string, ticketCount: number, durationMs: number) {
    this.posthog.capture(userId, 'prd_breakdown_completed', {
      source: 'backend',
      workspace_id: workspaceId,
      ticket_count: ticketCount,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  trackBulkEnrichmentStarted(userId: string, workspaceId: string, ticketCount: number) {
    this.posthog.capture(userId, 'bulk_enrichment_started', {
      source: 'backend',
      workspace_id: workspaceId,
      ticket_count: ticketCount,
      timestamp: new Date().toISOString(),
    });
  }

  trackBulkEnrichmentCompleted(userId: string, workspaceId: string, successCount: number, failureCount: number, durationMs: number) {
    this.posthog.capture(userId, 'bulk_enrichment_completed', {
      source: 'backend',
      workspace_id: workspaceId,
      success_count: successCount,
      failure_count: failureCount,
      total_count: successCount + failureCount,
      success_rate: successCount / (successCount + failureCount),
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track export operations
   */
  trackExportStarted(userId: string, ticketId: string, format: 'markdown' | 'json' | 'xml') {
    this.posthog.capture(userId, 'export_started', {
      source: 'backend',
      ticket_id: ticketId,
      format,
      timestamp: new Date().toISOString(),
    });
  }

  trackExportCompleted(userId: string, ticketId: string, format: 'markdown' | 'json' | 'xml', durationMs: number) {
    this.posthog.capture(userId, 'export_completed', {
      source: 'backend',
      ticket_id: ticketId,
      format,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track API performance and errors
   */
  trackAPIError(userId: string, endpoint: string, statusCode: number, error: string, durationMs: number) {
    this.posthog.capture(userId, 'api_error', {
      source: 'backend',
      endpoint,
      status_code: statusCode,
      error,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  trackAPISuccess(userId: string, endpoint: string, statusCode: number, durationMs: number) {
    this.posthog.capture(userId, 'api_success', {
      source: 'backend',
      endpoint,
      status_code: statusCode,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set user properties (traits)
   */
  setUserProperties(userId: string, properties: Record<string, any>) {
    this.posthog.setUserProperties(userId, properties);
  }
}
