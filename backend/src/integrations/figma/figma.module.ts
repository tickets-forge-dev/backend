import { Module } from '@nestjs/common';
import { FigmaService } from './figma.service';
import { FigmaTokensService } from './figma-tokens.service';
import { FigmaOAuthController } from './figma-oauth.controller';
import { FigmaIntegrationRepository } from './figma-integration.repository';
import { HttpClientService } from '../../shared/integrations/http-client.service';
import { PostHogModule } from '../../shared/infrastructure/posthog/posthog.module';

/**
 * FigmaModule - Figma OAuth & API Integration
 *
 * Provides:
 * - FigmaService: API client for Figma REST API
 * - FigmaOAuthController: OAuth flow (start, callback)
 * - FigmaIntegrationRepository: Token storage
 * - HttpClientService: Shared HTTP client with connection pooling
 * - TelemetryService: Analytics tracking for OAuth flows
 */
@Module({
  imports: [PostHogModule],
  controllers: [FigmaOAuthController],
  providers: [FigmaService, FigmaTokensService, FigmaIntegrationRepository, HttpClientService],
  exports: [FigmaService, FigmaTokensService, FigmaIntegrationRepository],
})
export class FigmaModule {}
