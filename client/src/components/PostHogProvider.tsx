'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { initPostHog, identify } from '@/lib/posthog';

/**
 * PostHog Provider Component
 *
 * Initializes PostHog and identifies users based on auth state
 * Wrap this around your app in the root layout
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  useEffect(() => {
    // Initialize PostHog on client mount
    initPostHog();
  }, []);

  // Identify user when auth state changes
  useEffect(() => {
    if (user) {
      identify({
        email: user.email,
        uid: user.uid,
      });
    }
  }, [user]);

  return children;
}
