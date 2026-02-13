import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit Breaker Service - Prevents cascading API failures
 *
 * Implements the Circuit Breaker pattern with three states:
 * - CLOSED: Normal operation, all requests go through
 * - OPEN: API failing, reject requests immediately (fast-fail)
 * - HALF_OPEN: Testing recovery, allow limited requests
 *
 * Benefits:
 * - Prevents wasted requests to failing APIs
 * - Allows failing services time to recover
 * - Faster error responses (no timeout waiting)
 * - Improved system resilience and availability
 *
 * @example
 * const breaker = new CircuitBreakerService('figma', { threshold: 5, timeout: 60000 });
 * try {
 *   const result = await breaker.execute(async () => figmaService.getFileMetadata(...));
 * } catch (error) {
 *   if (error.message.includes('circuit breaker')) {
 *     // Handle circuit open - API is failing
 *   }
 * }
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private nextAttemptTime: number | null = null;

  constructor(
    private readonly name: string, // e.g., 'figma', 'loom'
    private readonly options: {
      /**
       * Number of consecutive failures before opening circuit
       * @default 5
       */
      threshold: number;

      /**
       * Milliseconds to wait before attempting recovery (HALF_OPEN state)
       * @default 60000 (1 minute)
       */
      timeout: number;

      /**
       * Number of successful requests needed to close circuit from HALF_OPEN
       * @default 2
       */
      successThreshold: number;

      /**
       * Enable console logging for circuit state changes
       * @default true
       */
      logStateChanges: boolean;
    } = {
      threshold: 5,
      timeout: 60000,
      successThreshold: 2,
      logStateChanges: true,
    },
  ) {
    this.logger.debug(
      `Circuit breaker "${name}" initialized (threshold=${options.threshold}, timeout=${options.timeout}ms)`,
    );
  }

  /**
   * Execute an async operation with circuit breaker protection
   *
   * @param fn The async function to execute
   * @param fallback Optional fallback function if circuit is open
   * @returns Result of fn or fallback
   * @throws Error if circuit is open and no fallback provided
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T> | T,
  ): Promise<T> {
    // Check if we should attempt recovery (transition from OPEN to HALF_OPEN)
    if (this.state === 'OPEN') {
      if (!this.nextAttemptTime || Date.now() < this.nextAttemptTime) {
        // Still in cooldown period, circuit remains open
        if (fallback) {
          this.logger.debug(`Circuit "${this.name}" is OPEN, using fallback`);
          return await Promise.resolve(fallback());
        }
        throw new Error(
          `Circuit breaker "${this.name}" is OPEN. Service unavailable. Retry after ${
            this.nextAttemptTime ? Math.ceil((this.nextAttemptTime - Date.now()) / 1000) : 0
          }s`,
        );
      }

      // Transition to HALF_OPEN for recovery testing
      this._transitionTo('HALF_OPEN');
    }

    try {
      // Execute the operation
      const result = await fn();

      // Record success
      this._recordSuccess();

      return result;
    } catch (error) {
      // Record failure
      this._recordFailure();

      // Check if we should open the circuit
      if (this.failureCount >= this.options.threshold) {
        this._transitionTo('OPEN');
      }

      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Manually reset the circuit breaker to CLOSED state
   * Useful for manual recovery or testing
   */
  reset() {
    this._transitionTo('CLOSED');
  }

  /**
   * Get current circuit breaker state and metrics
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      isAvailable: this.state !== 'OPEN' || (this.nextAttemptTime && Date.now() >= this.nextAttemptTime),
    };
  }

  /**
   * Private: Record a successful request
   */
  private _recordSuccess() {
    this.failureCount = 0;
    this.successCount += 1;

    // Transition from HALF_OPEN to CLOSED if recovery successful
    if (this.state === 'HALF_OPEN' && this.successCount >= this.options.successThreshold) {
      this._transitionTo('CLOSED');
    }
  }

  /**
   * Private: Record a failed request
   */
  private _recordFailure() {
    this.failureCount += 1;
    this.successCount = 0;
    this.lastFailureTime = Date.now();

    this.logger.warn(
      `Circuit "${this.name}" failure recorded (${this.failureCount}/${this.options.threshold})`,
    );
  }

  /**
   * Private: Transition to a new state with logging
   */
  private _transitionTo(newState: 'CLOSED' | 'OPEN' | 'HALF_OPEN') {
    if (this.state === newState) {
      return; // No state change
    }

    const oldState = this.state;
    this.state = newState;

    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
      this.nextAttemptTime = null;
    } else if (newState === 'OPEN') {
      this.nextAttemptTime = Date.now() + this.options.timeout;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
      // Keep nextAttemptTime for reference
    }

    if (this.options.logStateChanges) {
      this.logger.warn(
        `Circuit "${this.name}" transitioned: ${oldState} → ${newState}`,
      );
    }
  }
}
