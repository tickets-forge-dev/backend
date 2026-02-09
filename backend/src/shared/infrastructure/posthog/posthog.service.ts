import { Injectable, Logger } from '@nestjs/common';
import { PostHog } from 'posthog-node';

/**
 * PostHog Service
 *
 * Centralized analytics service for backend event tracking
 * Tracks:
 * - Mastra agent executions
 * - API usage and performance
 * - Cost tracking (LLM tokens, API calls)
 * - User journeys
 *
 * Configuration:
 * - POSTHOG_API_KEY: PostHog project API key
 * - POSTHOG_HOST: PostHog instance URL (optional)
 */
@Injectable()
export class PostHogService {
  private posthog: PostHog | null = null;
  private readonly logger = new Logger(PostHogService.name);
  private enabled = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.POSTHOG_API_KEY;

    if (!apiKey) {
      this.logger.warn('[PostHog] POSTHOG_API_KEY not configured - analytics disabled');
      return;
    }

    try {
      this.posthog = new PostHog(apiKey, {
        host: process.env.POSTHOG_HOST,
        flushInterval: 10000, // Flush every 10 seconds
      });
      this.enabled = true;
      this.logger.log('[PostHog] Initialized successfully');
    } catch (error) {
      this.logger.error('[PostHog] Failed to initialize', error);
    }
  }

  /**
   * Track an event with properties
   */
  capture(
    distinctId: string,
    event: string,
    properties?: Record<string, any>,
  ) {
    if (!this.enabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId,
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(`[PostHog] Failed to capture event: ${event}`, error);
    }
  }

  /**
   * Set properties on a user
   */
  setUserProperties(distinctId: string, properties: Record<string, any>) {
    if (!this.enabled || !this.posthog) return;

    try {
      // In PostHog Node SDK, user properties are set via capture with $set
      this.posthog.capture({
        distinctId,
        event: '$set',
        properties: {
          $set: properties,
        },
      });
    } catch (error) {
      this.logger.error('[PostHog] Failed to set user properties', error);
    }
  }

  /**
   * Shutdown service and flush events
   */
  async shutdown() {
    if (!this.enabled || !this.posthog) return;

    try {
      await this.posthog.shutdown();
      this.logger.log('[PostHog] Shutdown complete');
    } catch (error) {
      this.logger.error('[PostHog] Error during shutdown', error);
    }
  }

  /**
   * Check if PostHog is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
