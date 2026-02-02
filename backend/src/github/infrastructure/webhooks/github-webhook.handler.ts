/**
 * GitHub Webhook Handler
 * 
 * Handles incoming GitHub webhook events for:
 * - push events: Trigger repository re-indexing
 * - pull_request events: Update branch metadata
 * 
 * Security: Verifies webhook signature using HMAC-SHA256
 * 
 * Part of: Story 4.2 - Task 1 (Deferred from Story 4.1)
 * Layer: Infrastructure
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  Inject,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IDriftDetector, DRIFT_DETECTOR } from '../../../tickets/application/services/drift-detector.interface';
import * as crypto from 'crypto';

interface PushPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    full_name: string;
    owner: {
      login: string;
    };
  };
  commits: Array<{
    id: string;
    message: string;
  }>;
}

interface PullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    id: number;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
    };
  };
  repository: {
    id: number;
    full_name: string;
  };
}

@ApiTags('webhooks')
@Controller('webhooks/github')
export class GitHubWebhookHandler {
  private readonly logger = new Logger(GitHubWebhookHandler.name);

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(DRIFT_DETECTOR)
    private readonly driftDetector?: IDriftDetector,
  ) {}

  /**
   * Handle GitHub webhook events
   * POST /api/webhooks/github
   * 
   * No auth guard - signature verification provides security
   */
  @Post()
  @HttpCode(200)
  @ApiExcludeEndpoint() // Don't expose in Swagger (webhook endpoint)
  async handleWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
    @Body() payload: any,
  ): Promise<{ received: boolean }> {
    // Verify webhook signature
    if (!this.verifySignature(signature, JSON.stringify(payload))) {
      this.logger.warn('Invalid webhook signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Received GitHub webhook: ${event} for repo ${payload.repository?.full_name}`);

    // Route to appropriate handler
    switch (event) {
      case 'push':
        await this.handlePushEvent(payload as PushPayload);
        break;
      case 'pull_request':
        await this.handlePullRequestEvent(payload as PullRequestPayload);
        break;
      case 'ping':
        this.logger.log('Ping event received - webhook configured successfully');
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event}`);
    }

    return { received: true };
  }

  /**
   * Handle push events
   * Triggers re-indexing of the repository
   */
  private async handlePushEvent(payload: PushPayload): Promise<void> {
    const { repository, ref, after: commitSha } = payload;

    this.logger.log(
      `Push event: ${repository.full_name} on ${ref} (${commitSha.substring(0, 7)})`,
    );

    // Extract branch name from ref (e.g., "refs/heads/main" -> "main")
    const branch = ref.replace('refs/heads/', '');

    // Trigger drift detection (Story 4.4) - non-blocking
    try {
      // TODO: Extract workspaceId from repository context or config
      // For now, using a placeholder - will need proper workspace mapping
      const workspaceId = 'default-workspace';
      
      if (this.driftDetector) {
        await this.driftDetector.detectDrift(
          workspaceId,
          repository.full_name,
          commitSha,
        );
      } else {
        this.logger.warn('Drift detector not available - skipping drift detection');
      }
    } catch (error) {
      this.logger.error(
        `Drift detection failed for ${repository.full_name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw - drift detection failure shouldn't block webhook
    }

    // TODO (Story 4.2): Queue re-indexing job
    // await this.indexingQueue.add('reindex-repository', {
    //   repositoryId: repository.id,
    //   repositoryName: repository.full_name,
    //   branch,
    //   commitSha,
    // });

    this.logger.log(
      `TODO: Queue re-indexing job for ${repository.full_name}@${branch}`,
    );
  }

  /**
   * Handle pull_request events
   * Updates branch metadata (new branches, PR info)
   */
  private async handlePullRequestEvent(
    payload: PullRequestPayload,
  ): Promise<void> {
    const { action, pull_request, repository } = payload;

    this.logger.log(
      `Pull request event: ${repository.full_name} PR#${pull_request.id} - ${action}`,
    );

    // Only index on PR open/synchronize (new commits pushed)
    if (action === 'opened' || action === 'synchronize') {
      // TODO (Story 4.2): Queue indexing for PR branch
      // await this.indexingQueue.add('index-pr-branch', {
      //   repositoryId: repository.id,
      //   repositoryName: repository.full_name,
      //   branch: pull_request.head.ref,
      //   commitSha: pull_request.head.sha,
      //   prNumber: pull_request.number,
      // });

      this.logger.log(
        `TODO: Queue indexing for PR branch ${pull_request.head.ref}`,
      );
    }
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   * 
   * GitHub sends signature in header: x-hub-signature-256
   * Format: "sha256=<hex-digest>"
   */
  verifySignature(signature: string, body: string): boolean {
    const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');

    if (!secret) {
      this.logger.error('GITHUB_WEBHOOK_SECRET not configured');
      return false;
    }

    if (!signature) {
      return false;
    }

    // Compute expected signature
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')}`;

    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      // Length mismatch or other error
      return false;
    }
  }
}
