import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import { TelemetryService } from '@shared/infrastructure/posthog/telemetry.service';
import type { Request } from 'express';

interface FeedbackDto {
  type: 'bug' | 'feature' | 'improvement' | 'other';
  message: string;
  url?: string;
}

@Controller('feedback')
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(private telemetry: TelemetryService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submitFeedback(
    @Body() dto: FeedbackDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Extract user ID from Firebase token (set by middleware)
      const userId = (req as any).user?.uid || 'anonymous';

      this.logger.log(`Received ${dto.type} feedback from ${userId}: ${dto.message}`);

      // Track feedback to PostHog
      this.telemetry.trackUserFeedback(userId, {
        type: dto.type,
        message: dto.message,
        url: dto.url,
      });

      this.logger.log(`Feedback tracked to PostHog for user: ${userId}`);

      return {
        success: true,
        message: 'Thank you for your feedback! We appreciate your input.',
      };
    } catch (error) {
      this.logger.error('Failed to process feedback', error);
      // Don't fail the request - feedback submission should be non-blocking
      return {
        success: true,
        message: 'Feedback received. Thank you!',
      };
    }
  }
}
