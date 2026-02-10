import { Module, OnApplicationShutdown } from '@nestjs/common';
import { PostHogService } from './posthog.service';
import { TelemetryService } from './telemetry.service';

@Module({
  providers: [PostHogService, TelemetryService],
  exports: [PostHogService, TelemetryService],
})
export class PostHogModule implements OnApplicationShutdown {
  constructor(private posthogService: PostHogService) {}

  async onApplicationShutdown() {
    await this.posthogService.shutdown();
  }
}
