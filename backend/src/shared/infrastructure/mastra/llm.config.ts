import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type LLMProvider = 'ollama' | 'anthropic';
export type ModelType = 'fast' | 'main';

export interface LLMInstance {
  generate(prompt: string): Promise<string>;
}

/**
 * LLM Configuration Service
 *
 * Toggles between Ollama (local debug) and Anthropic (production)
 * based on LLM_PROVIDER environment variable
 *
 * Returns model name strings for Mastra Agent API
 */
@Injectable()
export class LLMConfigService {
  private provider: LLMProvider;
  private fastModel: string;
  private mainModel: string;
  private ollamaBaseUrl: string = 'http://localhost:11434'; // Default value

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<LLMProvider>('LLM_PROVIDER') || 'ollama';

    // Model configuration based on provider
    if (this.provider === 'ollama') {
      // Ollama models (local debugging)
      this.fastModel = this.configService.get('OLLAMA_FAST_MODEL') || 'minimax-m2:cloud';
      this.mainModel = this.configService.get('OLLAMA_MAIN_MODEL') || 'minimax-m2:cloud';
      this.ollamaBaseUrl = this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434';

      console.log(`🔧 LLM Provider: Ollama (DEBUG MODE)`);
      console.log(`   Fast model: ${this.fastModel}`);
      console.log(`   Main model: ${this.mainModel}`);
      console.log(`   Base URL: ${this.ollamaBaseUrl}`);
    } else {
      // Anthropic/Claude models (production)
      this.fastModel = this.configService.get('ANTHROPIC_FAST_MODEL') || 'claude-3-5-haiku-20241022';
      this.mainModel = this.configService.get('ANTHROPIC_MAIN_MODEL') || 'claude-3-5-sonnet-20241022';

      console.log(`🚀 LLM Provider: Anthropic/Claude (PRODUCTION MODE)`);
      console.log(`   Fast model: ${this.fastModel}`);
      console.log(`   Main model: ${this.mainModel}`);
    }
  }

  /**
   * Get model name string for Mastra Agent
   * @param type - 'fast' for classification (steps 1,2,7), 'main' for content generation (step 5)
   * @returns Model string like "anthropic/claude-sonnet-4" or "ollama/minimax-m2:cloud"
   */
  getModelName(type: ModelType): string {
    const modelId = type === 'fast' ? this.fastModel : this.mainModel;

    if (this.provider === 'ollama') {
      // Use ollama provider prefix for Ollama models
      return `ollama/${modelId}`;
    } else {
      return `anthropic/${modelId}`;
    }
  }

  /**
   * Get a default LLM instance for text generation
   * Uses main model for quality
   */
  getDefaultLLM(): LLMInstance {
    return {
      generate: async (prompt: string): Promise<string> => {
        if (this.provider === 'ollama') {
          return this.callOllama(prompt);
        } else {
          return this.callAnthropic(prompt);
        }
      }
    };
  }

  /**
   * Call Ollama API
   */
  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.mainModel,
        prompt,
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.mainModel,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  /**
   * Get Anthropic API key (for Mastra)
   */
  getAnthropicApiKey(): string | undefined {
    return this.configService.get<string>('ANTHROPIC_API_KEY');
  }

  /**
   * Get Ollama base URL (for Mastra)
   */
  getOllamaBaseUrl(): string {
    return this.ollamaBaseUrl;
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}
