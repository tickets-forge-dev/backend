import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type LLMProvider = 'ollama' | 'anthropic';
export type ModelType = 'fast' | 'main';

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
  private ollamaBaseUrl: string = 'http://localhost:11434/v1'; // Default value

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<LLMProvider>('LLM_PROVIDER') || 'ollama';

    // Model configuration based on provider
    if (this.provider === 'ollama') {
      // Ollama models (local debugging)
      this.fastModel = this.configService.get('OLLAMA_FAST_MODEL') || 'qwen2.5-coder:latest';
      this.mainModel = this.configService.get('OLLAMA_MAIN_MODEL') || 'qwen2.5-coder:latest';
      this.ollamaBaseUrl = this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434/v1';

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
   * @returns Model string like "anthropic/claude-sonnet-4" or "ollama/qwen2.5-coder:latest"
   */
  getModelName(type: ModelType): string {
    const modelId = type === 'fast' ? this.fastModel : this.mainModel;
    
    if (this.provider === 'ollama') {
      // Mastra requires provider prefix even with baseUrl
      return `ollama/${modelId}`;
    } else {
      return `anthropic/${modelId}`;
    }
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
