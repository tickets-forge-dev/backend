import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAnthropic } from '@ai-sdk/anthropic';

export type ModelType = 'fast' | 'main';

/**
 * LLM Configuration Service
 *
 * Anthropic-only configuration for production use.
 * Uses ANTHROPIC_API_KEY and ANTHROPIC_MODEL from environment.
 */
@Injectable()
export class LLMConfigService {
  private model: string;
  private apiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-haiku-20240307';
  }

  /**
   * Get model instance
   * @param _type - Model type (currently same model for both fast and main)
   */
  getModel(_type: ModelType): any {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set in .env');
    }
    const anthropic = createAnthropic({ apiKey: this.apiKey });
    return anthropic(this.model);
  }

  getProvider(): string {
    return 'anthropic';
  }

  getModelName(): string {
    return this.model;
  }
}
