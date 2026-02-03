import { createAnthropic } from '@ai-sdk/anthropic';

/**
 * Anthropic/Claude provider configuration for Mastra
 * Used in PRODUCTION mode
 */
export function createAnthropicProvider(apiKey: string) {
  return createAnthropic({
    apiKey,
  });
}
