/**
 * Frontend version of cURL generator utility
 * Mirrors backend version for consistency
 * Used by ApiCard component and export features
 */

export interface CurlOptions {
  method: string;
  path: string;
  baseUrl?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

/**
 * Generate a cURL command string from API spec
 * Output is ready to copy-paste into terminal
 */
export function generateCurlCommand(options: CurlOptions): string {
  const {
    method,
    path,
    baseUrl = 'http://localhost:3000',
    body,
    headers = {},
    queryParams = {},
  } = options;

  // Build URL with query params
  let url = `${baseUrl}${path}`;
  const queryString = new URLSearchParams(queryParams).toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  // Start with method and URL
  let cmd = `curl -X ${method} '${url}'`;

  // Add headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  const allHeaders = { ...defaultHeaders, ...headers };

  for (const [key, value] of Object.entries(allHeaders)) {
    cmd += ` \\\n  -H '${key}: ${value}'`;
  }

  // Add body for POST/PUT/PATCH
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    const bodyJson = JSON.stringify(body);
    cmd += ` \\\n  -d '${bodyJson}'`;
  }

  return cmd;
}

/**
 * Format cURL command for display (with line breaks for readability)
 */
export function formatCurlCommand(curlCommand: string): string {
  return curlCommand;
}

/**
 * Parse a cURL command back to options (reverse operation)
 * Useful for editing existing cURL commands
 */
export function parseCurlCommand(curlCommand: string): CurlOptions {
  // Basic parser - can be enhanced
  const methodMatch = curlCommand.match(/-X\s+(\w+)/);
  const urlMatch = curlCommand.match(/'(https?:\/\/[^']+)'/);
  const bodyMatch = curlCommand.match(/-d\s+'([^']+)'/);

  const method = methodMatch ? methodMatch[1] : 'GET';
  const fullUrl = urlMatch ? urlMatch[1] : '';
  const body = bodyMatch ? JSON.parse(bodyMatch[1]) : undefined;

  // Extract base URL and path
  const url = new URL(fullUrl);
  const baseUrl = `${url.protocol}//${url.host}`;
  const path = url.pathname + url.search;

  return {
    method,
    path,
    baseUrl,
    body,
  };
}

/**
 * Copy text to clipboard (frontend)
 * Shows success toast notification
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') {
    // Server-side (shouldn't happen in frontend)
    console.warn('copyToClipboard: navigator not available');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Copy cURL to clipboard and show toast
 * Frontend helper with user feedback
 */
export async function copyWithToast(
  curlCommand: string,
  showToast?: (message: string) => void,
): Promise<void> {
  const success = await copyToClipboard(curlCommand);

  if (success && showToast) {
    showToast('cURL command copied to clipboard! 📋');
  } else if (!success && showToast) {
    showToast('Failed to copy cURL command. Try manually selecting and copying.');
  }
}

/**
 * Validate cURL command syntax
 */
export function validateCurlCommand(curlCommand: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!curlCommand.includes('curl')) {
    errors.push('Command must start with "curl"');
  }

  if (!curlCommand.includes('-X') && !curlCommand.includes('--request')) {
    errors.push('Must specify HTTP method with -X or --request');
  }

  if (!curlCommand.match(/'https?:\/\//) && !curlCommand.match(/"https?:\/\//)) {
    errors.push('Must specify a valid URL');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Pretty print JSON for display in cURL body
 */
export function prettifyJson(json: string | Record<string, unknown>): string {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return JSON.stringify(obj, null, 2);
  } catch {
    return '';
  }
}
