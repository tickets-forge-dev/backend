import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { PostHogModule } from '@shared/infrastructure/posthog/posthog.module';

@Module({
  imports: [PostHogModule],
  controllers: [FeedbackController],
})
export class FeedbackModule {}
