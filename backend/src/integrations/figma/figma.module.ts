import { Module } from '@nestjs/common';
import { FigmaService } from './figma.service';
import { FigmaOAuthController } from './figma-oauth.controller';
import { FigmaIntegrationRepository } from './figma-integration.repository';

/**
 * FigmaModule - Figma OAuth & API Integration
 *
 * Provides:
 * - FigmaService: API client for Figma REST API
 * - FigmaOAuthController: OAuth flow (start, callback)
 * - FigmaIntegrationRepository: Token storage
 */
@Module({
  controllers: [FigmaOAuthController],
  providers: [FigmaService, FigmaIntegrationRepository],
  exports: [FigmaService, FigmaIntegrationRepository],
})
export class FigmaModule {}
