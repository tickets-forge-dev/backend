import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ollama } from './providers/ollama.provider';
import { claude } from './providers/anthropic.provider';

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
    this.provider = this.configService.get<LLMProvider>('LLM_PROVIDER') || 'ollama';

    // Model configuration based on provider
    if (this.provider === 'ollama') {
      // Ollama models (local debugging)
      this.fastModel = this.configService.get('OLLAMA_FAST_MODEL') || 'qwen2.5-coder:latest';
      this.mainModel = this.configService.get('OLLAMA_MAIN_MODEL') || 'qwen2.5-coder:latest';

      console.log(`🔧 LLM Provider: Ollama (DEBUG MODE)`);
      console.log(`   Fast model: ${this.fastModel}`);
      console.log(`   Main model: ${this.mainModel}`);
      console.log(`   Base URL: ${this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434/v1'}`);
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
   * Get model instance based on type and provider
   * @param type - 'fast' for classification (steps 1,2,7), 'main' for content generation (step 5)
   */
  getModel(type: ModelType) {
    const modelId = type === 'fast' ? this.fastModel : this.mainModel;

    if (this.provider === 'ollama') {
      return ollama(modelId);
    } else {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not set in .env');
      }
      return claude(apiKey, modelId);
    }
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}
