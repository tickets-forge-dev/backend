/**
 * Parses a curl command into structured ApiCallDetails
 *
 * Extracts method, URL, headers, and body from curl command
 * Supports common curl options: -X, -H, -d, --data, --data-raw
 *
 * @param curl - curl command string
 * @returns Structured ApiCallDetails
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
  // Extract method (-X POST, -X GET, etc.)
  const methodMatch = curl.match(/-X\s+(\w+)/i);
  const method = methodMatch?.[1]?.toUpperCase() || 'GET';

  // Extract URL - after curl keyword, possibly after -X method
  const urlMatch = curl.match(/curl\s+(?:-[a-zA-Z]\s+\S+\s+)*(['"])?([^\s'";]+)\1/);
  const url = urlMatch?.[2] || '';

  // Extract headers (-H "key: value" or -H 'key: value')
  const headerMatches = [...curl.matchAll(/-H\s+['"]([^'"]+)['"]/g)];
  const headers: Record<string, string> = {};

  headerMatches.forEach((match) => {
    const headerLine = match[1];
    const [key, ...valueParts] = headerLine.split(': ');
    const value = valueParts.join(': ');
    if (key && value) {
      headers[key.trim()] = value.trim();
    }
  });

  // Extract body (-d, --data, --data-raw)
  // Use [\s\S] instead of . with /s flag for compatibility
  const bodyMatch = curl.match(/(?:-d|--data|--data-raw)\s+['"](.+?)['"]/);
  const body = bodyMatch?.[1];

  return {
    method,
    url,
    ...(Object.keys(headers).length > 0 && { headers }),
    ...(body && { body }),
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
export function generateCurlCommand(call: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}): string {
  let cmd = `curl -X ${call.method} ${call.url}`;

  if (call.headers) {
    Object.entries(call.headers).forEach(([key, value]) => {
      cmd += ` -H "${key}: ${value}"`;
    });
  }

  if (call.body) {
    // Escape quotes in body for shell
    const escapedBody = call.body.replace(/"/g, '\\"');
    cmd += ` -d '${escapedBody}'`;
  }

  return cmd;
}
