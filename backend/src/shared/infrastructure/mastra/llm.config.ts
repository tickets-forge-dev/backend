import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ollama } from './providers/ollama.provider';

export type LLMProvider = 'ollama' | 'anthropic';
export type ModelType = 'fast' | 'main';

/**
 * LLM Configuration Service
 *
 * Toggles between Ollama (local debug) and Anthropic (production)
 * based on LLM_PROVIDER environment variable
 */
@Injectable()
export class LLMConfigService {
  private provider: LLMProvider;
  private fastModel: string;
  private mainModel: string;

  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const defaultProvider: LLMProvider = nodeEnv === 'production' ? 'anthropic' : 'ollama';
    this.provider = this.configService.get<LLMProvider>('LLM_PROVIDER') || defaultProvider;

    // Model configuration based on provider
    if (this.provider === 'ollama') {
      // Ollama models (local debugging)
      this.fastModel = this.configService.get('OLLAMA_FAST_MODEL') || 'qwen2.5-coder:latest';
      this.mainModel = this.configService.get('OLLAMA_MAIN_MODEL') || 'qwen2.5-coder:latest';
    } else {
      // Anthropic/Claude models (production)
      this.fastModel =
        this.configService.get('ANTHROPIC_FAST_MODEL') || 'claude-3-5-haiku-20241022';
      this.mainModel =
        this.configService.get('ANTHROPIC_MAIN_MODEL') || 'claude-3-5-haiku-20241022';
    }
  }

  /**
   * Get model instance based on type and provider
   * @param type - 'fast' for classification (steps 1,2,7), 'main' for content generation (step 5)
   */
  getModel(type: ModelType): any {
    const modelId = type === 'fast' ? this.fastModel : this.mainModel;

    if (this.provider === 'ollama') {
      return ollama(modelId);
    } else {
      // Anthropic provider - dynamically import to avoid hard dependency
      // This will be properly implemented in the TechSpecGenerator (Story 9.4)
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not set in .env');
      }
      throw new Error(
        'Anthropic provider requires @ai-sdk/anthropic to be installed. This feature will be implemented in Story 9.4.',
      );
    }
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}
