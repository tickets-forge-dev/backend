// @ai-sdk/anthropic import removed - will be installed in Story 9.4
// This file is kept for future TechSpecGenerator integration

/**
 * Anthropic/Claude provider for production
 * Requires: npm install @ai-sdk/anthropic
 *
 * FOR PRODUCTION USE
 * Requires ANTHROPIC_API_KEY in .env
 *
 * NOTE: This will be properly implemented in Story 9.4 (TechSpecGenerator)
 */
export const createAnthropicProvider = (apiKey: string) => {
  throw new Error('Anthropic provider requires @ai-sdk/anthropic to be installed. Install with: npm install @ai-sdk/anthropic');
};

/**
 * Create a Claude model instance
 * @param modelId - Claude model name
 */
export const claude = (apiKey: string, modelId: string): any => {
  throw new Error('Anthropic provider requires @ai-sdk/anthropic to be installed. Install with: npm install @ai-sdk/anthropic');
};
