/**
 * Analytics Event Types
 *
 * Defines all trackable events in Forge
 * Used by both frontend and backend for consistent event naming and properties
 */

// User authentication events
export type AuthEvent = 'auth_signup' | 'auth_login' | 'auth_logout' | 'auth_error';

// Integration events
export type IntegrationEvent =
  | 'integration_connected'
  | 'integration_disconnected'
  | 'integration_error';
export type JiraIntegrationEvent =
  | IntegrationEvent
  | 'jira_issue_searched'
  | 'jira_issue_imported';
export type LinearIntegrationEvent =
  | IntegrationEvent
  | 'linear_issue_searched'
  | 'linear_issue_imported';

// Ticket creation events
export type TicketCreationEvent =
  | 'ticket_creation_started'
  | 'ticket_creation_mode_selected' // 'create_new' | 'import'
  | 'repository_selected'
  | 'branch_selected'
  | 'ticket_details_entered'
  | 'deep_analysis_started'
  | 'deep_analysis_completed'
  | 'questions_shown'
  | 'question_answered'
  | 'ticket_spec_generated'
  | 'ticket_finalized';

// Agent execution events
export type AgentExecutionEvent =
  | 'agent_execution_started'
  | 'agent_execution_completed'
  | 'agent_execution_failed'
  | 'agent_token_usage'
  | 'agent_cost_tracked';

// Ticket management events
export type TicketManagementEvent =
  | 'ticket_viewed'
  | 'ticket_updated'
  | 'ticket_deleted'
  | 'ticket_exported'
  | 'ticket_shared';

// All events
export type AnalyticsEvent =
  | AuthEvent
  | IntegrationEvent
  | JiraIntegrationEvent
  | LinearIntegrationEvent
  | TicketCreationEvent
  | AgentExecutionEvent
  | TicketManagementEvent;

/**
 * Common event properties
 */
export interface BaseEventProperties {
  timestamp?: string;
  user_id?: string;
  workspace_id?: string;
  session_id?: string;
}

/**
 * Ticket creation properties
 */
export interface TicketCreationProperties extends BaseEventProperties {
  ticket_id?: string;
  mode?: 'create_new' | 'import';
  repository?: string;
  branch?: string;
  type?: string;
  priority?: string;
  import_source?: 'jira' | 'linear';
}

/**
 * Agent execution properties
 */
export interface AgentExecutionProperties extends BaseEventProperties {
  agent_name: string;
  agent_type?: string;
  duration_ms: number;
  status: 'success' | 'failed' | 'timeout';
  error?: string;
  tokens_input?: number;
  tokens_output?: number;
  total_tokens?: number;
  model?: string;
  cost_usd?: number;
}

/**
 * Deep analysis properties
 */
export interface DeepAnalysisProperties extends BaseEventProperties {
  ticket_id?: string;
  repository: string;
  files_analyzed: number;
  duration_ms: number;
  phase?: 'fingerprinting' | 'analysis' | 'generation';
  cost_usd?: number;
  success: boolean;
}

/**
 * Cost tracking properties
 */
export interface CostTrackingProperties extends BaseEventProperties {
  ticket_id?: string;
  service: 'openai' | 'anthropic' | 'jira' | 'linear' | 'github';
  tokens_input?: number;
  tokens_output?: number;
  cost_usd: number;
  model?: string;
  operation?: string;
}
