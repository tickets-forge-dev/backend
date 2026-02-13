'use client';

import { useEffect } from 'react';
import { initPostHog } from '@/lib/posthog';

/**
 * PostHogProvider - Initialize PostHog analytics on client
 *
 * Initializes PostHog JS SDK with environment variables
 * Runs once on app startup to enable client-side event tracking
 *
 * Configuration:
 * - NEXT_PUBLIC_POSTHOG_KEY: PostHog project API key
 * - NEXT_PUBLIC_POSTHOG_HOST: Custom PostHog instance (optional)
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog on client mount
    initPostHog();
  }, []);

  return <>{children}</>;
}
