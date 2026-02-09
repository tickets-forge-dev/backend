import { Module, OnApplicationShutdown } from '@nestjs/common';
import { PostHogService } from './posthog.service';

@Module({
  providers: [PostHogService],
  exports: [PostHogService],
})
export class PostHogModule implements OnApplicationShutdown {
  constructor(private posthogService: PostHogService) {}

  async onApplicationShutdown() {
    await this.posthogService.shutdown();
  }
}
