/**
 * Centralized error messages with actionable guidance
 */

export const ERROR_MESSAGES = {
  firebaseConfigFetch: {
    title: '❌ Firebase Config Fetch Failed',
    cause: 'Backend not responding or NEXT_PUBLIC_API_URL misconfigured',
    actions: [
      'Start backend: cd backend && pnpm dev',
      'Verify NEXT_PUBLIC_API_URL in .env.local',
      'Check that backend is running on the correct port',
    ],
    fallback: 'Using environment variables (if set)',
    docsLink: 'docs/SETUP-TROUBLESHOOTING.md#firebase-config',
  },

  posthogInvalidKey: {
    title: '❌ PostHog API Key Format Error',
    cause: 'Using Personal API Key (phx_*) instead of Project API Key (phc_*)',
    actions: [
      'Go to PostHog → Project Settings → API Keys',
      'Copy the "Project API Key" (starts with phc_, NOT phx_)',
      'Update NEXT_PUBLIC_POSTHOG_KEY in .env.local',
    ],
    fallback: 'Analytics disabled',
    docsLink: 'docs/SETUP-TROUBLESHOOTING.md#posthog-api-key',
  },

  missingApiUrl: {
    title: '❌ API URL Not Configured',
    cause: 'NEXT_PUBLIC_API_URL environment variable is missing',
    actions: [
      'Create .env.local in the client directory if it doesn\'t exist',
      'Add: NEXT_PUBLIC_API_URL=http://localhost:3000/api',
      'Restart the dev server',
    ],
    docsLink: 'docs/SETUP-TROUBLESHOOTING.md#api-url',
  },

  backendUnreachable: {
    title: '⚠️ Backend Not Responding',
    cause: 'Cannot connect to backend API',
    actions: [
      'Start the backend server: cd backend && pnpm dev',
      'Verify backend is running on http://localhost:3000',
      'Check for port conflicts or firewall issues',
    ],
    docsLink: 'docs/SETUP-TROUBLESHOOTING.md#backend-connectivity',
  },

  firebaseConfigIncomplete: {
    title: '⚠️ Incomplete Firebase Configuration',
    cause: 'Some Firebase environment variables are missing',
    required: [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ],
    actions: [
      'Get Firebase config from Firebase Console → Project Settings',
      'Add all required variables to .env.local',
    ],
    docsLink: 'docs/SETUP-TROUBLESHOOTING.md#firebase-config',
  },
};

/**
 * Format an error message for console output
 */
export function formatErrorMessage(
  error: typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES]
): string {
  const lines = [
    error.title,
    `Cause: ${error.cause}`,
    'Actions:',
    ...error.actions.map((action, i) => `  ${i + 1}. ${action}`),
  ];

  if ('fallback' in error && error.fallback) {
    lines.push(`Fallback: ${error.fallback}`);
  }

  if ('docsLink' in error && error.docsLink) {
    lines.push(`Docs: ${error.docsLink}`);
  }

  return lines.join('\n');
}

/**
 * Format required fields list
 */
export function formatRequiredFields(fields: string[]): string {
  return fields.map((field) => `  - ${field}`).join('\n');
}
