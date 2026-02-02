/**
 * GitHub Module
 *
 * Provides GitHub API integration for repository and branch operations.
 * Used by the ticket creation flow to capture repository context.
 */

import { Module } from '@nestjs/common';
import { GitHubController } from './presentation/controllers/github.controller';

@Module({
  controllers: [GitHubController],
})
export class GitHubModule {}
