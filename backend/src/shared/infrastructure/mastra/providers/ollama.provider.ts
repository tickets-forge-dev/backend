import { createOpenAI } from '@ai-sdk/openai';

/**
 * Custom fetch middleware to fix 'developer' role issue with Ollama
 * Ollama only supports: system, user, assistant (not 'developer')
 */
function ollamaCompatibleFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  if (options?.body) {
    try {
      const body = JSON.parse(options.body as string);
      // Convert 'developer' role to 'system' role for Ollama compatibility
      if (body.messages && Array.isArray(body.messages)) {
        body.messages = body.messages.map((msg: any) => {
          if (msg.role === 'developer') {
            return { ...msg, role: 'system' };
          }
          return msg;
        });
      }
      options.body = JSON.stringify(body);
    } catch (error) {
      console.warn('Failed to parse request body for developer role fix:', error);
    }
  }
  return fetch(url, options);
}

/**
 * Ollama provider using OpenAI-compatible API
 * Requires: npm install @ai-sdk/openai
 *
 * FOR DEBUG/DEVELOPMENT ONLY
 * Requires Ollama running locally: ollama serve
 */
export const createOllamaProvider = (baseURL?: string) => {
  // Ensure baseURL always ends with /v1 for OpenAI-compatible API
  let resolvedURL = baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  if (!resolvedURL.endsWith('/v1')) {
    resolvedURL = resolvedURL.replace(/\/+$/, '') + '/v1';
  }

  return createOpenAI({
    name: 'ollama',
    apiKey: 'ollama', // Ollama doesn't require API key
    baseURL: resolvedURL,
    fetch: ollamaCompatibleFetch as any, // Type assertion for custom fetch
  });
};

/**
 * Create a chat model instance
 * @param modelId - Ollama model name (e.g., 'qwen2.5-coder:latest', 'llama3.1')
 */
export const ollama = (modelId: string): any => {
  const provider = createOllamaProvider();
  return provider.chat(modelId);
};
