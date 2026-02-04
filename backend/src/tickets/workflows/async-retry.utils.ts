/**
 * Async Retry Utility (Phase B Fix #9)
 * 
 * Provides resilient error handling for transient failures in workflow async operations.
 * Implements exponential backoff (1s, 2s, 4s) with max 3 attempts.
 */

export interface RetryConfig {
  maxAttempts?: number; // Default: 3
  initialDelayMs?: number; // Default: 1000ms
  backoffMultiplier?: number; // Default: 2
  stepName?: string; // For logging context
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  lastDelayMs?: number;
}

/**
 * Executes an async function with exponential backoff retry logic.
 * 
 * Retries on transient errors (network, timeout, temporary service failures).
 * Fails fast on permanent errors (validation, not found, authentication).
 * 
 * @param fn Async function to execute
 * @param config Retry configuration
 * @returns Result object with success flag, data, error, and attempt count
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    stepName = 'Unknown',
  } = config;

  let lastError: Error | null = null;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fn();
      if (attempt > 1) {
        console.log(
          `✅ [${stepName}] Recovered after ${attempt} attempts`
        );
      }
      return { success: true, data, attempts: attempt };
    } catch (error: any) {
      lastError = error;

      // Check if error is transient (retryable) or permanent (fail fast)
      const isTransient = isTransientError(error);
      const isLastAttempt = attempt === maxAttempts;

      if (!isTransient || isLastAttempt) {
        const errorType = isTransient ? 'transient' : 'permanent';
        console.error(
          `❌ [${stepName}] Failed after ${attempt} attempts (${errorType}): ${error.message}`
        );
        return {
          success: false,
          error: lastError,
          attempts: attempt,
        };
      }

      // Log retry attempt
      console.warn(
        `⚠️ [${stepName}] Attempt ${attempt}/${maxAttempts} failed: ${error.message}. ` +
        `Retrying in ${delayMs}ms...`
      );

      // Wait before retrying
      await sleep(delayMs);
      delayMs = Math.min(delayMs * backoffMultiplier, 30000); // Cap at 30s
    }
  }

  // Should never reach here, but just in case
  return {
    success: false,
    error: lastError || new Error('Unknown error after max retries'),
    attempts: maxAttempts,
  };
}

/**
 * Determines if an error is transient (should retry) or permanent (should fail fast).
 * 
 * Transient errors:
 * - Network timeouts
 * - Service unavailable (5xx)
 * - Rate limiting (429)
 * - Temporary database locks
 * 
 * Permanent errors:
 * - Validation errors (4xx except 429)
 * - Authentication/Authorization
 * - Not found
 * - Invalid parameters
 */
function isTransientError(error: any): boolean {
  if (!error) return false;

  const message = (error.message || '').toLowerCase();
  const code = error.code?.toString() || '';

  // HTTP status codes
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    // Transient: 5xx, 429, 408 (timeout)
    if (status >= 500 || status === 429 || status === 408) {
      return true;
    }
    // Permanent: 4xx (except 429)
    if (status >= 400 && status < 500) {
      return false;
    }
  }

  // Network/timeout errors
  if (
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('socket hang up') ||
    message.includes('network') ||
    message.includes('temporary failure')
  ) {
    return true;
  }

  // Database lock errors (temporary)
  if (
    message.includes('locked') ||
    message.includes('contention') ||
    message.includes('retry')
  ) {
    return true;
  }

  // Service unavailable
  if (
    message.includes('unavailable') ||
    message.includes('service not available') ||
    message.includes('temporarily unavailable')
  ) {
    return true;
  }

  // Permanent validation/not found errors
  if (
    message.includes('not found') ||
    message.includes('invalid') ||
    message.includes('validation') ||
    message.includes('authentication') ||
    message.includes('unauthorized')
  ) {
    return false;
  }

  // Default to transient for unknown errors (safer to retry)
  return true;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
