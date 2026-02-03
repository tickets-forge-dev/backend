import { createOpenAI } from '@ai-sdk/openai';

/**
 * Ollama provider configuration for Mastra
 * Used in DEBUG mode for local development
 */
export function createOllamaProvider(baseUrl: string) {
  return createOpenAI({
    baseURL: baseUrl,
    apiKey: 'ollama', // Ollama doesn't need a real API key
  });
}
