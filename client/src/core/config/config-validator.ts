/**
 * Core configuration validation logic
 */

import type { ConfigValidationResult, ValidationCheck } from './types';
import { ERROR_MESSAGES, formatErrorMessage } from './error-messages';

/**
 * Validates all critical environment variables and configuration
 */
export async function validateConfig(): Promise<ConfigValidationResult> {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  const result: ConfigValidationResult = {
    isValid: true,
    errors,
    warnings,
    status: {
      firebaseConfig: 'missing',
      apiUrl: 'using-default',
      posthogKey: 'missing',
      backendReachable: false,
    },
  };

  // Validate NEXT_PUBLIC_API_URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    errors.apiUrl = 'NEXT_PUBLIC_API_URL is not set';
    result.isValid = false;
  } else {
    result.status.apiUrl = 'set';

    // Test backend connectivity (optional, async)
    try {
      const response = await fetch(`${apiUrl}/config/firebase`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      if (response.ok) {
        result.status.backendReachable = true;
        result.status.firebaseConfig = 'backend';
      } else {
        warnings.push('Backend is running but returned an error');
      }
    } catch (error) {
      warnings.push('Backend is not reachable (will use environment variables)');
    }
  }

  // Validate Firebase config by checking if it's available globally
  // (NEXT_PUBLIC_* vars are bundled at build time, not available via process.env at runtime)
  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  // Check if Firebase config is available via globals (set at build time)
  // This is more reliable than checking process.env which is empty at runtime
  const hasFirebaseFromGlobals = typeof window !== 'undefined' &&
    (window as any).__FIREBASE_CONFIG__ !== undefined;

  // Fallback: check if any Firebase vars were bundled at build time
  const hasFirebaseVars = firebaseVars.some(
    (varName) => {
      // Try to access the bundled variable - if it exists, it was in the env at build time
      try {
        return (globalThis as any)[`__${varName}__`] !== undefined ||
               process.env[varName] !== undefined;
      } catch {
        return false;
      }
    }
  );

  // If we have Firebase initialized or backend can provide config, it's working
  if (result.status.backendReachable && result.status.firebaseConfig === 'backend') {
    // Backend provided Firebase config - good!
    result.status.firebaseConfig = 'backend';
  } else if (hasFirebaseFromGlobals || hasFirebaseVars) {
    result.status.firebaseConfig = 'env';
  } else {
    // Only error if we truly have no way to get Firebase config
    errors.firebaseConfig = 'No Firebase configuration found';
    result.status.firebaseConfig = 'missing';
    result.isValid = false;
  }

  // Validate PostHog key format (optional)
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (posthogKey) {
    if (posthogKey.startsWith('phx_')) {
      warnings.push(
        'PostHog: Using Personal API Key (phx_). Get Project API Key (phc_) from PostHog → Project Settings'
      );
      result.status.posthogKey = 'invalid-format';
    } else if (posthogKey.startsWith('phc_')) {
      result.status.posthogKey = 'valid';
    } else {
      warnings.push('PostHog: API key format not recognized');
      result.status.posthogKey = 'invalid-format';
    }
  } else {
    warnings.push('PostHog: API key not set (analytics disabled)');
    result.status.posthogKey = 'missing';
  }

  return result;
}

/**
 * Get validation checks as a structured list
 */
export function getValidationChecks(
  result: ConfigValidationResult
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // API URL check
  if (result.errors.apiUrl) {
    checks.push({
      name: 'API URL',
      status: 'error',
      message: result.errors.apiUrl,
      resolution: 'Add NEXT_PUBLIC_API_URL to .env.local',
    });
  } else if (result.status.apiUrl === 'set') {
    checks.push({
      name: 'API URL',
      status: 'valid',
      message: 'Configured correctly',
    });
  }

  // Backend connectivity check
  if (result.status.backendReachable) {
    checks.push({
      name: 'Backend',
      status: 'valid',
      message: 'Connected',
    });
  } else {
    checks.push({
      name: 'Backend',
      status: 'warning',
      message: 'Not responding',
      resolution: 'Start backend: cd backend && pnpm dev',
    });
  }

  // Firebase config check
  if (result.errors.firebaseConfig) {
    checks.push({
      name: 'Firebase',
      status: 'error',
      message: result.errors.firebaseConfig,
      resolution: 'Add Firebase environment variables to .env.local',
    });
  } else if (result.status.firebaseConfig === 'backend') {
    checks.push({
      name: 'Firebase',
      status: 'valid',
      message: 'Using backend configuration',
    });
  } else if (result.status.firebaseConfig === 'env') {
    checks.push({
      name: 'Firebase',
      status: 'valid',
      message: 'Using environment variables',
    });
  }

  // PostHog check
  if (result.status.posthogKey === 'valid') {
    checks.push({
      name: 'PostHog',
      status: 'valid',
      message: 'Configured correctly',
    });
  } else if (result.status.posthogKey === 'invalid-format') {
    checks.push({
      name: 'PostHog',
      status: 'warning',
      message: 'Invalid key format (using Personal key instead of Project key)',
      resolution:
        'Get Project API Key from PostHog → Project Settings → API Keys',
    });
  } else {
    checks.push({
      name: 'PostHog',
      status: 'warning',
      message: 'Not configured (analytics disabled)',
      resolution: 'Optional: Add NEXT_PUBLIC_POSTHOG_KEY to .env.local',
    });
  }

  return checks;
}

/**
 * Log validation results to console with formatting
 */
export function logValidationResults(result: ConfigValidationResult): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ Forge Configuration Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const checks = getValidationChecks(result);

  for (const check of checks) {
    const icon =
      check.status === 'valid'
        ? '✓'
        : check.status === 'warning'
          ? '⚠'
          : '✗';
    const color =
      check.status === 'valid'
        ? '\x1b[32m'
        : check.status === 'warning'
          ? '\x1b[33m'
          : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${icon}${reset} ${check.name}: ${check.message}`);
    if (check.resolution) {
      console.log(`  → ${check.resolution}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (result.isValid) {
    console.log('✓ All critical configuration valid\n');
  } else {
    console.log('✗ Configuration issues detected\n');
  }

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    result.warnings.forEach((warning) => console.log(`  - ${warning}`));
    console.log();
  }

  if (Object.keys(result.errors).length > 0) {
    console.log('See docs/SETUP-TROUBLESHOOTING.md for help\n');
  }
}
