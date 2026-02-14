import posthog from 'posthog-js';

/**
 * Initialize PostHog analytics
 *
 * Configuration:
 * - NEXT_PUBLIC_POSTHOG_KEY: PostHog project API key
 * - NEXT_PUBLIC_POSTHOG_HOST: PostHog instance URL (defaults to US cloud)
 *
 * Usage:
 * ```typescript
 * import { track, identify } from '@/lib/posthog';
 *
 * track('ticket_created', { type: 'feature', priority: 'high' });
 * identify({ email: 'user@example.com', plan: 'pro' });
 * ```
 */

export const initPostHog = () => {
  if (typeof window === 'undefined') return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey) {
    console.warn('[PostHog] Missing NEXT_PUBLIC_POSTHOG_KEY - analytics disabled');
    return;
  }

  posthog.init(apiKey, {
    // Use reverse proxy to avoid ad blocker issues
    // Requests go to /api/ingest/* instead of directly to posthog.com
    api_host: host || '/api/ingest',
    ui_host: 'https://us.posthog.com', // PostHog UI for session replay, surveys, etc.
    loaded: (ph) => {
      console.log('[PostHog] Initialized with proxy at /api/ingest');
    },
    capture_pageview: true, // Automatically capture page views
    disable_compression: false,
  });
};

/**
 * Track a custom event
 */
export const track = (event: string, properties?: Record<string, any>) => {
  if (!posthog.config) {
    console.warn('[PostHog] Not initialized');
    return;
  }
  posthog.capture(event, {
    source: 'client',
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Identify the current user
 */
export const identify = (properties: Record<string, any>) => {
  if (!posthog.config) {
    console.warn('[PostHog] Not initialized');
    return;
  }
  // Use uid as distinctId if available, otherwise use email
  const distinctId = properties.uid || properties.email;
  if (!distinctId) {
    console.warn('[PostHog] Cannot identify: no uid or email provided');
    return;
  }
  posthog.identify(distinctId, properties);
};

/**
 * Set user properties (traits)
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!posthog.config) {
    console.warn('[PostHog] Not initialized');
    return;
  }
  // PostHog JS SDK: set user properties via setPersonProperties
  posthog.setPersonProperties(properties);
};

/**
 * Reset user session (on logout)
 */
export const resetUser = () => {
  if (!posthog.config) return;
  posthog.reset();
};

/**
 * High-level client-side event tracking methods
 * Each method automatically adds source:'client' and timestamp
 */
export const clientEvents = {
  // Ticket creation flow
  ticketCreationStarted: (ticketId: string, mode: 'create_new' | 'import') => {
    track('ticket_creation_started', { ticket_id: ticketId, mode });
  },

  stageCompleted: (stage: string, durationMs: number) => {
    track('wizard_stage_completed', { stage, duration_ms: durationMs });
  },

  wizardAbandoned: (stage: string, completionPercentage: number) => {
    track('wizard_abandoned', { stage, completion_percentage: completionPercentage });
  },

  // Design link operations (Phase 2)
  designLinkAdded: (platform: string) => {
    track('design_link_added_client', { platform });
  },

  designLinkRemoved: (platform: string) => {
    track('design_link_removed_client', { platform });
  },

  designPreviewViewed: (platform: string, hasMetadata: boolean) => {
    track('design_preview_viewed', { platform, has_metadata: hasMetadata });
  },

  // Question answering
  questionAnswered: (questionIndex: number, answerTime: number) => {
    track('question_answered_client', { question_index: questionIndex, answer_time_ms: answerTime });
  },

  allQuestionsSkipped: (totalQuestions: number) => {
    track('all_questions_skipped', { total_questions: totalQuestions });
  },

  // Ticket detail view
  ticketDetailViewed: (ticketId: string, hasSpec: boolean) => {
    track('ticket_detail_viewed', { ticket_id: ticketId, has_spec: hasSpec });
  },

  specSectionExpanded: (section: string) => {
    track('spec_section_expanded', { section });
  },

  specSectionCollapsed: (section: string) => {
    track('spec_section_collapsed', { section });
  },

  // Integration operations
  integrationConnectClicked: (integration: string) => {
    track('integration_connect_clicked', { integration });
  },

  integrationDisconnectClicked: (integration: string) => {
    track('integration_disconnect_clicked', { integration });
  },

  // Error tracking
  clientError: (errorMessage: string, component: string, errorStack?: string) => {
    track('client_error', {
      error_message: errorMessage,
      component,
      error_stack: errorStack,
    });
  },

  apiError: (endpoint: string, statusCode: number, errorMessage: string) => {
    track('api_call_error', {
      endpoint,
      status_code: statusCode,
      error_message: errorMessage,
    });
  },

  // Performance tracking
  pageLoadTime: (page: string, loadTimeMs: number) => {
    track('page_load_time', { page, load_time_ms: loadTimeMs });
  },

  componentRenderTime: (component: string, renderTimeMs: number) => {
    track('component_render_time', { component, render_time_ms: renderTimeMs });
  },

  apiLatency: (endpoint: string, latencyMs: number) => {
    track('api_latency', { endpoint, latency_ms: latencyMs });
  },

  // User engagement
  featureUsed: (feature: string, context?: Record<string, any>) => {
    track('feature_used', { feature, ...context });
  },

  settingsChanged: (setting: string, oldValue: any, newValue: any) => {
    track('settings_changed', { setting, old_value: oldValue, new_value: newValue });
  },
};

export default posthog;
