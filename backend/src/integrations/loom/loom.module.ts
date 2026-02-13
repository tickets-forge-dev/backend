import { Module } from '@nestjs/common';
import { LoomService } from './loom.service';
import { LoomOAuthController } from './loom-oauth.controller';
import { LoomIntegrationRepository } from './loom-integration.repository';
import { HttpClientService } from '../../shared/integrations/http-client.service';
import { PostHogModule } from '../../shared/infrastructure/posthog/posthog.module';

/**
 * LoomModule - Loom OAuth & API Integration
 *
 * Provides:
 * - LoomService: API client for Loom API
 * - LoomOAuthController: OAuth flow (start, callback)
 * - LoomIntegrationRepository: Token storage
 * - HttpClientService: Shared HTTP client with connection pooling
 * - TelemetryService: Analytics tracking for OAuth flows
 */
@Module({
  imports: [PostHogModule],
  controllers: [LoomOAuthController],
  providers: [LoomService, LoomIntegrationRepository, HttpClientService],
  exports: [LoomService, LoomIntegrationRepository],
})
export class LoomModule {}
