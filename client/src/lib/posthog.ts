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
    api_host: host || 'https://us.posthog.com',
    loaded: (ph) => {
      console.log('[PostHog] Initialized');
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
  posthog.capture(event, properties);
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

export default posthog;
