import { Module } from '@nestjs/common';
import { LoomService } from './loom.service';
import { LoomOAuthController } from './loom-oauth.controller';
import { LoomIntegrationRepository } from './loom-integration.repository';

/**
 * LoomModule - Loom OAuth & API Integration
 *
 * Provides:
 * - LoomService: API client for Loom API
 * - LoomOAuthController: OAuth flow (start, callback)
 * - LoomIntegrationRepository: Token storage
 */
@Module({
  controllers: [LoomOAuthController],
  providers: [LoomService, LoomIntegrationRepository],
  exports: [LoomService, LoomIntegrationRepository],
})
export class LoomModule {}
