'use client';

import { useEffect, useState } from 'react';
import { validateConfig, getValidationChecks } from '@/core/config/config-validator';
import type { ConfigValidationResult } from '@/core/config/types';
import { ConfigStatusBadge } from './ConfigStatusBadge';

/**
 * Development-only health check banner that shows configuration status on startup
 * Only renders in development mode and can be dismissed per session
 */
export function DevStartupHealthCheck() {
  const [validationResult, setValidationResult] = useState<ConfigValidationResult | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('forge-health-check-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }

    // Run validation
    validateConfig()
      .then((result) => {
        setValidationResult(result);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Health check validation error:', error);
        setIsLoading(false);
      });
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('forge-health-check-dismissed', 'true');
    setIsDismissed(true);
  };

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  // Don't render while loading
  if (isLoading) {
    return null;
  }

  // Don't render if validation failed to run
  if (!validationResult) {
    return null;
  }

  // Don't render if everything is perfect
  const hasIssues =
    !validationResult.isValid ||
    validationResult.warnings.length > 0 ||
    !validationResult.status.backendReachable ||
    validationResult.status.posthogKey === 'invalid-format';

  if (!hasIssues) {
    return null;
  }

  const checks = getValidationChecks(validationResult);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚡</span>
              <h3 className="text-sm font-semibold">
                Forge Development Setup
              </h3>
            </div>

            <div className="space-y-2 mb-3">
              {checks.map((check, index) => (
                <ConfigStatusBadge
                  key={index}
                  name={check.name}
                  status={check.status}
                  message={check.message}
                  resolution={check.resolution}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <a
                href="https://github.com/your-org/forge/blob/main/docs/SETUP-TROUBLESHOOTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline"
              >
                Learn More →
              </a>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground text-sm"
            title="Dismiss (will reappear on next page load)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
