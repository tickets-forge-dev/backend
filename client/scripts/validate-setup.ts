#!/usr/bin/env node
/**
 * Setup validation script - validates configuration before dev server starts
 * Run with: npm run validate-setup
 */

import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Load environment variables from .env.local
 */
function loadEnvFile(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  const env: Record<string, string> = {};

  if (!fs.existsSync(envPath)) {
    return env;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  }

  return env;
}

/**
 * Check if backend is reachable
 */
async function checkBackendConnectivity(apiUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/config/firebase`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Validate configuration
 */
async function validate(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  console.log(`${colors.cyan}⚡ Forge Setup Validation${colors.reset}`);
  console.log('━'.repeat(60));

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    result.warnings.push('.env.local file not found (using system environment)');
    console.log(
      `${colors.yellow}⚠${colors.reset} .env.local not found (optional)`
    );
  } else {
    console.log(`${colors.green}✓${colors.reset} .env.local exists`);
  }

  // Load environment variables
  const env = { ...process.env, ...loadEnvFile() };

  // Validate NEXT_PUBLIC_API_URL
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    result.errors.push('NEXT_PUBLIC_API_URL is not set');
    result.success = false;
    console.log(
      `${colors.red}✗${colors.reset} NEXT_PUBLIC_API_URL is missing`
    );
    console.log(
      `  ${colors.dim}→ Add to .env.local: NEXT_PUBLIC_API_URL=http://localhost:3000/api${colors.reset}`
    );
  } else {
    console.log(`${colors.green}✓${colors.reset} NEXT_PUBLIC_API_URL is set`);

    // Test backend connectivity
    const backendReachable = await checkBackendConnectivity(apiUrl);
    if (backendReachable) {
      console.log(
        `${colors.green}✓${colors.reset} Backend connection: ${apiUrl}`
      );
    } else {
      result.warnings.push('Backend is not reachable');
      console.log(
        `${colors.yellow}⚠${colors.reset} Backend not responding: ${apiUrl}`
      );
      console.log(
        `  ${colors.dim}→ Start backend: cd backend && pnpm dev${colors.reset}`
      );
    }
  }

  // Validate Firebase config
  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingFirebaseVars = firebaseVars.filter((varName) => !env[varName]);

  if (missingFirebaseVars.length === 0) {
    console.log(`${colors.green}✓${colors.reset} Firebase config complete`);
  } else if (missingFirebaseVars.length === firebaseVars.length) {
    result.errors.push('No Firebase configuration found');
    result.success = false;
    console.log(`${colors.red}✗${colors.reset} Firebase config missing`);
    console.log(
      `  ${colors.dim}→ Add Firebase environment variables to .env.local${colors.reset}`
    );
  } else {
    result.warnings.push(`Incomplete Firebase config: ${missingFirebaseVars.join(', ')}`);
    console.log(
      `${colors.yellow}⚠${colors.reset} Firebase config incomplete (missing ${missingFirebaseVars.length} vars)`
    );
    console.log(
      `  ${colors.dim}→ Missing: ${missingFirebaseVars.join(', ')}${colors.reset}`
    );
  }

  // Validate PostHog key (optional)
  const posthogKey = env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!posthogKey) {
    result.warnings.push('PostHog API key not set (analytics disabled)');
    console.log(
      `${colors.yellow}⚠${colors.reset} PostHog key missing (optional, analytics disabled)`
    );
  } else if (posthogKey.startsWith('phx_')) {
    result.warnings.push(
      'PostHog: Using Personal API Key (phx_). Get Project API Key (phc_) from PostHog → Project Settings'
    );
    console.log(
      `${colors.yellow}⚠${colors.reset} PostHog: Invalid key format (phx_ = Personal, need phc_ = Project)`
    );
    console.log(
      `  ${colors.dim}→ Get Project API Key from PostHog → Project Settings → API Keys${colors.reset}`
    );
  } else if (posthogKey.startsWith('phc_')) {
    console.log(`${colors.green}✓${colors.reset} PostHog configured`);
  } else {
    result.warnings.push('PostHog: API key format not recognized');
    console.log(
      `${colors.yellow}⚠${colors.reset} PostHog: Unrecognized key format`
    );
  }

  console.log('━'.repeat(60));

  // Summary
  if (result.success && result.warnings.length === 0) {
    console.log(`${colors.green}All Systems Ready! 🚀${colors.reset}\n`);
  } else if (result.success) {
    console.log(
      `${colors.yellow}Ready with warnings${colors.reset} (${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'})\n`
    );
  } else {
    console.log(
      `${colors.red}Setup issues found${colors.reset} (${result.errors.length} error${result.errors.length === 1 ? '' : 's'})\n`
    );
    console.log('Fix the errors above, then run: npm run validate-setup');
    console.log('See docs/SETUP-TROUBLESHOOTING.md for help\n');
  }

  return result;
}

// Run validation
validate()
  .then((result) => {
    // Exit with code 1 if there are blocking errors
    // Warnings are OK and don't block startup
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error(`${colors.red}Validation script error:${colors.reset}`, error);
    process.exit(1);
  });
