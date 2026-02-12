/**
 * Valid HTTP methods supported by the curl generator
 */
const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

/**
 * Parses a curl command into structured ApiCallDetails
 *
 * Extracts method, URL, headers, and body from curl command
 * Supports common curl options: -X, -H, -d, --data, --data-raw
 *
 * Throws errors if:
 * - Command is empty
 * - URL cannot be extracted
 * - HTTP method is invalid
 *
 * @param curl - curl command string
 * @returns Structured ApiCallDetails
 * @throws Error if command is invalid or cannot be parsed
 *
 * @example
 * ```typescript
 * const curl = `curl -X POST https://api.example.com/tickets \\
 *   -H "Authorization: Bearer abc123" \\
 *   -H "Content-Type: application/json" \\
 *   -d '{"title":"Test"}'`;
 * const details = parseCurlCommand(curl);
 * // Returns:
 * // {
 * //   method: 'POST',
 * //   url: 'https://api.example.com/tickets',
 * //   headers: {
 * //     'Authorization': 'Bearer abc123',
 * //     'Content-Type': 'application/json'
 * //   },
 * //   body: '{"title":"Test"}'
 * // }
 * ```
 */
export function parseCurlCommand(curl: string): {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
} {
  if (!curl || curl.trim() === '') {
    throw new Error('curl command is empty');
  }

  // Extract method (-X POST, -X GET, etc.)
  const methodMatch = curl.match(/-X\s+(\w+)/i);
  let method = methodMatch?.[1]?.toUpperCase() || 'GET';

  // Validate method
  if (!VALID_HTTP_METHODS.includes(method as any)) {
    throw new Error(`Invalid HTTP method: ${method}. Must be one of: ${VALID_HTTP_METHODS.join(', ')}`);
  }

  // Extract URL - simplified pattern: find curl keyword, then first non-whitespace that looks like a URL
  // This handles: curl https://url, curl -X POST https://url, curl 'https://url', etc.
  const urlMatch = curl.match(/(?:curl|curl\.exe)\s+(?:[^-\s]|-[a-z]\s[^\s]+\s)*(['"]?)([^\s'"]+)\1/i);
  const url = urlMatch?.[2] || '';

  if (!url) {
    throw new Error('Could not extract URL from curl command');
  }

  // Extract headers (-H "key: value" or -H 'key: value')
  const headerMatches = [...curl.matchAll(/-H\s+['"]([^'"]+)['"]/g)];
  const headers: Record<string, string> = {};

  headerMatches.forEach((match) => {
    const headerLine = match[1];
    const colonIndex = headerLine.indexOf(':');
    if (colonIndex > 0) {
      const key = headerLine.substring(0, colonIndex).trim();
      const value = headerLine.substring(colonIndex + 1).trim();
      if (key && value) {
        headers[key] = value;
      }
    }
  });

  // Extract body (-d, --data, --data-raw)
  // Try multiple patterns for better compatibility
  let body: string | undefined;

  // Pattern 1: Single quotes with content (including empty)
  const singleQuoteMatch = curl.match(/(?:-d|--data|--data-raw)\s+'([^']*)'/);
  if (singleQuoteMatch) {
    body = singleQuoteMatch[1];
  } else {
    // Pattern 2: Double quotes with content (including empty)
    const doubleQuoteMatch = curl.match(/(?:-d|--data|--data-raw)\s+"([^"]*)"/);
    if (doubleQuoteMatch) {
      body = doubleQuoteMatch[1];
    }
  }

  return {
    method,
    url,
    ...(Object.keys(headers).length > 0 && { headers }),
    ...(body !== undefined && { body }),
  };
}

/**
 * Generates a curl command from ApiCallDetails
 *
 * @param call - ApiCallDetails
 * @returns curl command string
 *
 * @example
 * ```typescript
 * const call = {
 *   method: 'POST',
 *   url: '/api/tickets/create',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: '{"title":"Test"}'
 * };
 * const curl = generateCurlCommand(call);
 * // Returns: curl -X POST /api/tickets/create -H "Content-Type: application/json" -d '{"title":"Test"}'
 * ```
 */
/**
 * Escapes a string for safe use in a single-quoted shell string
 * Single quotes preserve everything literally except single quotes themselves
 * To include a single quote, we end the string, add an escaped quote, and start a new string
 * Example: don't → 'don'\''t'
 */
function escapeForShell(str: string): string {
  return `'${str.replace(/'/g, "'\\''")}'`;
}

export function generateCurlCommand(call: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}): string {
  // Validate method
  if (!VALID_HTTP_METHODS.includes(call.method as any)) {
    throw new Error(`Invalid HTTP method: ${call.method}`);
  }

  // Validate URL is not empty
  if (!call.url || call.url.trim() === '') {
    throw new Error('URL is required');
  }

  // Use single quotes for entire command for maximum safety
  // Single quotes preserve everything literally except single quotes themselves
  let cmd = `curl -X ${call.method} ${escapeForShell(call.url)}`;

  if (call.headers) {
    Object.entries(call.headers).forEach(([key, value]) => {
      if (!key || !value) return; // Skip empty headers
      // Escape header values properly
      cmd += ` -H ${escapeForShell(`${key}: ${value}`)}`;
    });
  }

  if (call.body && call.body.trim() !== '') {
    // Escape body for shell
    cmd += ` -d ${escapeForShell(call.body)}`;
  }

  return cmd;
}
