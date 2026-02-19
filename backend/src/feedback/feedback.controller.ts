import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { IsEnum, IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { TelemetryService } from '@shared/infrastructure/posthog/telemetry.service';
import type { Request } from 'express';

enum FeedbackType {
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  OTHER = 'other',
}

export class FeedbackDto {
  @IsEnum(FeedbackType, {
    message: 'Invalid feedback type. Must be: bug, feature, improvement, or other',
  })
  type!: FeedbackType;

  @IsString({ message: 'Message must be a string' })
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  message!: string;

  @IsOptional()
  @IsString({ message: 'URL must be a string' })
  @MaxLength(2048, { message: 'URL cannot exceed 2048 characters' })
  url?: string;
}

@Controller('feedback')
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);
  private readonly MAX_MESSAGE_LENGTH = 5000;

  constructor(private telemetry: TelemetryService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submitFeedback(
    @Body() dto: FeedbackDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate input
      this.validateFeedback(dto);

      // Extract user ID from Firebase token (set by middleware)
      const userId = (req as any).user?.uid || 'anonymous';
      const userIp = this.getUserIp(req);

      // Sanitize message (remove leading/trailing whitespace)
      const sanitizedMessage = dto.message.trim();

      if (!sanitizedMessage) {
        throw new BadRequestException('Message cannot be empty or only whitespace');
      }

      this.logger.log(
        `Received ${dto.type} feedback from ${userId} (${userIp}): ${sanitizedMessage.substring(0, 100)}...`,
      );

      // Track feedback to PostHog
      this.telemetry.trackUserFeedback(userId, {
        type: dto.type,
        message: sanitizedMessage,
        url: dto.url,
      });

      this.logger.log(`Feedback tracked to PostHog for user: ${userId}`);

      return {
        success: true,
        message: 'Thank you for your feedback! We appreciate your input.',
      };
    } catch (error) {
      // Re-throw validation errors
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Failed to process feedback', error);
      // Don't fail the request - feedback submission should be non-blocking
      return {
        success: true,
        message: 'Feedback received. Thank you!',
      };
    }
  }

  private validateFeedback(dto: any): void {
    // Ensure object has required fields
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Invalid request body');
    }

    // Validate type
    if (!dto.type) {
      throw new BadRequestException('Feedback type is required');
    }

    if (!Object.values(FeedbackType).includes(dto.type)) {
      throw new BadRequestException(
        `Invalid feedback type: ${dto.type}. Must be one of: ${Object.values(FeedbackType).join(', ')}`,
      );
    }

    // Validate message
    if (!dto.message) {
      throw new BadRequestException('Message is required');
    }

    if (typeof dto.message !== 'string') {
      throw new BadRequestException('Message must be a string');
    }

    if (dto.message.length > this.MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters`,
      );
    }

    // Validate URL if provided
    if (dto.url && typeof dto.url !== 'string') {
      throw new BadRequestException('URL must be a string');
    }
  }

  private getUserIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}
