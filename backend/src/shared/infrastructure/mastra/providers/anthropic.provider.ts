import { createAnthropic } from '@ai-sdk/anthropic';

/**
 * Anthropic/Claude provider for production
 * Requires: npm install @ai-sdk/anthropic
 *
 * FOR PRODUCTION USE
 * Requires ANTHROPIC_API_KEY in .env
 */
export const createAnthropicProvider = (apiKey: string) => {
  return createAnthropic({
    apiKey,
  });
};

/**
 * Create a Claude model instance
 * @param modelId - Claude model name
 */
export const claude = (apiKey: string, modelId: string): any => {
  const provider = createAnthropicProvider(apiKey);
  return provider.chat(modelId);
};
