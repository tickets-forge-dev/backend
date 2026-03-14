import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAnthropic } from '@ai-sdk/anthropic';

export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
export const DEFAULT_FAST_MODEL = 'claude-haiku-4-5-20251001';

export type ModelType = 'fast' | 'main';

/**
 * LLM Configuration Service
 *
 * Anthropic-only configuration for production use.
 * Uses ANTHROPIC_API_KEY, ANTHROPIC_MODEL, and ANTHROPIC_FAST_MODEL from environment.
 */
@Injectable()
export class LLMConfigService {
  private model: string;
  private fastModel: string;
  private apiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.model = this.configService.get<string>('ANTHROPIC_MODEL') || DEFAULT_MODEL;
    this.fastModel = this.configService.get<string>('ANTHROPIC_FAST_MODEL') || DEFAULT_FAST_MODEL;
  }

  /**
   * Get model instance
   * @param type - 'main' for primary model, 'fast' for lightweight/commodity calls
   */
  getModel(type: ModelType): any {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set in .env');
    }
    const anthropic = createAnthropic({ apiKey: this.apiKey });
    return anthropic(type === 'fast' ? this.fastModel : this.model);
  }

  getProvider(): string {
    return 'anthropic';
  }

  getModelName(type: ModelType = 'main'): string {
    return type === 'fast' ? this.fastModel : this.model;
  }
}
