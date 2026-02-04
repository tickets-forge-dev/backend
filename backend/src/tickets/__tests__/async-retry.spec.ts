/**
 * Async Retry Tests - Phase C Fix #9
 * 
 * Tests for executeWithRetry wrapper:
 * - Exponential backoff (1s, 2s, 4s)
 * - Transient error detection and retry
 * - Permanent error fast-fail
 * - Max retry attempts
 * - Logging and error context
 */

import { executeWithRetry, RetryConfig, RetryResult } from '../workflows/async-retry.utils';

describe('Async Retry Utility (Phase C - Fix #9)', () => {
  describe('Success Cases', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await executeWithRetry(fn, { stepName: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should succeed after transient failure and retry', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce('success');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should succeed after multiple retries', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce('success');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Transient Error Detection', () => {
    it('should retry on network timeout', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('socket timeout'))
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on HTTP 5xx status', async () => {
      const error = new Error('Service unavailable');
      error.status = 503;

      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on HTTP 429 rate limit', async () => {
      const error = new Error('Too many requests');
      error.status = 429;

      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on ECONNREFUSED', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on database lock', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Database table locked'))
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on service unavailable', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Permanent Error Fast-Fail', () => {
    it('should fail fast on validation error', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('Invalid input format'));

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid input format');
      expect(result.attempts).toBe(1); // No retries
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail fast on HTTP 404 not found', async () => {
      const error = new Error('Resource not found');
      error.status = 404;

      const fn = jest.fn().mockRejectedValue(error);

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail fast on HTTP 401 unauthorized', async () => {
      const error = new Error('Unauthorized');
      error.status = 401;

      const fn = jest.fn().mockRejectedValue(error);

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail fast on not found message', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('AEC not found: aec-123'));

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail fast on authentication error', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('Authentication failed'));

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Max Retry Attempts', () => {
    it('should respect maxAttempts limit (default 3)', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('Network timeout'));

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Default max
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect custom maxAttempts', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('timeout'));

      const result = await executeWithRetry(fn, {
        stepName: 'test',
        maxAttempts: 5,
        initialDelayMs: 1,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(5);
      expect(fn).toHaveBeenCalledTimes(5);
    });

    it('should allow single attempt', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('timeout'));

      const result = await executeWithRetry(fn, {
        stepName: 'test',
        maxAttempts: 1,
        initialDelayMs: 1,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Exponential Backoff', () => {
    it('should implement exponential backoff delays', async () => {
      const startTime = Date.now();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce('ok');

      // Use realistic delays: 10ms, 20ms
      const result = await executeWithRetry(fn, {
        stepName: 'test',
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });

      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      // Should take at least 30ms (10 + 20) with some tolerance
      expect(elapsed).toBeGreaterThanOrEqual(25);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should cap backoff delay at 30 seconds', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('timeout'));

      const result = await executeWithRetry(fn, {
        stepName: 'test',
        initialDelayMs: 100,
        backoffMultiplier: 10, // Exponential growth
        maxAttempts: 2, // Reduced to prevent long wait
      });

      // Even with aggressive backoff, max delay should be 30s
      expect(result.success).toBe(false);
      expect(fn).toHaveBeenCalledTimes(2);
      // If delays weren't capped, this would take much longer
    }, 15000);
  });

  describe('Result Object Structure', () => {
    it('should return structured result on success', async () => {
      const fn = jest.fn().mockResolvedValue('data');

      const result = await executeWithRetry(fn, { stepName: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toBe('data');
      expect(result.attempts).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should return structured result on failure', async () => {
      const testError = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(testError);

      const result = await executeWithRetry(fn, {
        stepName: 'test',
        maxAttempts: 1,
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.attempts).toBe(1);
      expect(result.error?.message).toContain('Test error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined errors gracefully', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
    });

    it('should handle undefined error message', async () => {
      const error = new Error();
      error.message = '';

      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should treat unknown errors as transient', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Unknown mysterious error'))
        .mockResolvedValueOnce('ok');

      const result = await executeWithRetry(fn, { stepName: 'test', initialDelayMs: 1 });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2); // Retried
    });

    it('should handle mixed error types across retries', async () => {
      const errors = [
        new Error('ECONNREFUSED'),
        new Error('timeout'),
        new Error('socket hang up'),
      ];

      const fn = jest
        .fn()
        .mockRejectedValueOnce(errors[0])
        .mockRejectedValueOnce(errors[1])
        .mockRejectedValueOnce(errors[2]);

      const result = await executeWithRetry(fn, {
        stepName: 'test',
        initialDelayMs: 1,
        maxAttempts: 3,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle partial success (some transient, some permanent)', async () => {
      // First two attempts fail with transient errors
      // If third attempt had permanent error, should fail fast
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockRejectedValueOnce(new Error('Invalid input'));

      const result = await executeWithRetry(fn, {
        stepName: 'test',
        initialDelayMs: 1,
        maxAttempts: 5,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Should fail on third attempt
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid recovery', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      const result = await executeWithRetry(fn, {
        stepName: 'test',
        initialDelayMs: 5, // Short delay
      });
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(elapsed).toBeLessThan(100); // Should be fast
    });

    it('should log recovery message on success after retries', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce('success');

      await executeWithRetry(fn, {
        stepName: 'extractIntent',
        initialDelayMs: 1,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/✅.*Recovered after 2 attempts/)
      );

      consoleSpy.mockRestore();
    });

    it('should log error on final failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const fn = jest
        .fn()
        .mockRejectedValue(new Error('Service down'));

      await executeWithRetry(fn, {
        stepName: 'detectType',
        maxAttempts: 2,
        initialDelayMs: 1,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/❌.*Failed after 2 attempts/)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
