import { Injectable, Inject, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import {
  ProjectProfileRepository,
  PROJECT_PROFILE_REPOSITORY,
} from '../ports/ProjectProfileRepository.port';
import { JobRepository, JOB_REPOSITORY } from '../../../jobs/application/ports/JobRepository.port';
import { GenerationJob } from '../../../jobs/domain/GenerationJob';
import { RepositoryFingerprintService } from '../../../tickets/application/services/RepositoryFingerprintService';
import { ProfileTextBuilder } from './ProfileTextBuilder';
import { GitHubTokenService } from '../../../github/application/services/github-token.service';
import {
  GitHubIntegrationRepository,
  GITHUB_INTEGRATION_REPOSITORY,
} from '../../../github/domain/GitHubIntegrationRepository';
import { FileTree } from '../../../tickets/domain/deep-analysis/deep-analysis.service';

/** Config file paths to read during scan */
const CONFIG_FILES = [
  'package.json',
  'tsconfig.json',
  'Cargo.toml',
  'go.mod',
  'requirements.txt',
  'pyproject.toml',
  'Gemfile',
  'pom.xml',
  'build.gradle',
  '.eslintrc.json',
  '.prettierrc',
  'docker-compose.yml',
  'Dockerfile',
];

@Injectable()
export class BackgroundScanService {
  private readonly logger = new Logger(BackgroundScanService.name);

  constructor(
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly profileRepository: ProjectProfileRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
    private readonly fingerprintService: RepositoryFingerprintService,
    private readonly githubTokenService: GitHubTokenService,
    @Inject(GITHUB_INTEGRATION_REPOSITORY)
    private readonly githubIntegrationRepository: GitHubIntegrationRepository,
  ) {}

  /**
   * Main entry point: runs background scan for a given profile.
   * Fire-and-forget — caller does not await this.
   */
  async run(
    profileId: string,
    teamId: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    let jobId: string | null = null;

    try {
      // Load profile
      const profile = await this.profileRepository.findById(profileId, teamId);
      if (!profile) {
        this.logger.error(`Profile ${profileId} not found`);
        return;
      }

      // Create a GenerationJob for the scan (visible in jobs panel)
      const job = GenerationJob.createNew(
        teamId,
        profileId, // ticketId field repurposed for profileId
        `Scanning ${profile.repoOwner}/${profile.repoName}`,
        userId,
        undefined,
        'scan',
      );
      await this.jobRepository.save(job);
      jobId = job.id;

      // Mark profile as scanning
      profile.markScanning();
      await this.profileRepository.save(profile);

      // Get GitHub token
      await this.updateJobProgress(jobId, teamId, 'connecting', 5);
      if (!this.githubIntegrationRepository) {
        throw new Error('GitHub integration not configured');
      }
      const integration =
        await this.githubIntegrationRepository.findByWorkspaceId(workspaceId);
      if (!integration) {
        throw new Error('GitHub not connected');
      }
      const accessToken = await this.githubTokenService.decryptToken(
        integration.encryptedAccessToken,
      );
      const octokit = new Octokit({ auth: accessToken });

      // Step 1: Fetch repo metadata
      await this.updateJobProgress(jobId, teamId, 'fetching_metadata', 10);
      const { data: repoData } = await octokit.rest.repos.get({
        owner: profile.repoOwner,
        repo: profile.repoName,
      });

      // Check cancellation
      if (await this.isCancelled(jobId, teamId, profileId)) return;

      // Step 2: Fetch recursive file tree
      await this.updateJobProgress(jobId, teamId, 'fetching_tree', 25);
      const refResponse = await octokit.rest.git.getRef({
        owner: profile.repoOwner,
        repo: profile.repoName,
        ref: `heads/${profile.branch}`,
      });
      const commitSha = refResponse.data.object.sha;

      const treeResponse = await octokit.rest.git.getTree({
        owner: profile.repoOwner,
        repo: profile.repoName,
        tree_sha: commitSha,
        recursive: '1' as any,
      });

      const fileTree: FileTree = {
        sha: treeResponse.data.sha,
        url: treeResponse.data.url,
        tree: (treeResponse.data.tree || []).map((entry: any) => ({
          path: entry.path!,
          mode: entry.mode!,
          type: entry.type as 'blob' | 'tree',
          sha: entry.sha!,
          size: entry.size,
          url: entry.url!,
        })),
        truncated: treeResponse.data.truncated || false,
      };

      // Check cancellation
      if (await this.isCancelled(jobId, teamId, profileId)) return;

      // Step 3: Read config files
      await this.updateJobProgress(jobId, teamId, 'reading_configs', 45);
      const configContents: Record<string, string> = {};
      for (const filePath of CONFIG_FILES) {
        try {
          const response = await octokit.rest.repos.getContent({
            owner: profile.repoOwner,
            repo: profile.repoName,
            path: filePath,
            ref: profile.branch,
          });
          if (
            'content' in response.data &&
            typeof response.data.content === 'string'
          ) {
            configContents[filePath] = Buffer.from(
              response.data.content,
              'base64',
            ).toString('utf-8');
          }
        } catch {
          // File not found — expected
        }
      }

      // Check cancellation
      if (await this.isCancelled(jobId, teamId, profileId)) return;

      // Step 4: Fingerprint tech stack
      await this.updateJobProgress(jobId, teamId, 'detecting_stack', 60);
      const fingerprint = this.fingerprintService.extractFingerprint(
        fileTree,
        configContents,
      );

      // Step 5: Read README
      await this.updateJobProgress(jobId, teamId, 'reading_readme', 70);
      let readmeContent: string | null = null;
      try {
        const readmeResponse = await octokit.rest.repos.getContent({
          owner: profile.repoOwner,
          repo: profile.repoName,
          path: 'README.md',
          ref: profile.branch,
        });
        if (
          'content' in readmeResponse.data &&
          typeof readmeResponse.data.content === 'string'
        ) {
          readmeContent = Buffer.from(
            readmeResponse.data.content,
            'base64',
          ).toString('utf-8');
        }
      } catch {
        // No README — that's fine
      }

      // Check cancellation
      if (await this.isCancelled(jobId, teamId, profileId)) return;

      // Step 6: Build profile text
      await this.updateJobProgress(jobId, teamId, 'building_profile', 85);
      const profileContent = ProfileTextBuilder.build({
        repoOwner: profile.repoOwner,
        repoName: profile.repoName,
        branch: profile.branch,
        commitSha,
        repoDescription: repoData.description,
        fingerprint,
        fileTree: fileTree.tree,
        configContents,
        readmeContent,
      });

      // Step 7: Mark profile ready
      const fileCount = fileTree.tree.filter((e) => e.type === 'blob').length;
      const techStack = [
        ...fingerprint.languages,
        ...fingerprint.frameworks,
      ];
      profile.markReady(profileContent, fileCount, techStack, commitSha);
      await this.profileRepository.save(profile);

      // Mark job completed
      await this.updateJobProgress(jobId, teamId, 'complete', 100);
      const completedJob = await this.jobRepository.findById(jobId, teamId);
      if (completedJob) {
        completedJob.markCompleted();
        await this.jobRepository.save(completedJob);
      }

      this.logger.log(
        `Scan completed for ${profile.repoOwner}/${profile.repoName}: ${fileCount} files, stack: ${techStack.join(', ')}`,
      );
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Scan failed for profile ${profileId}: ${rawMessage}`,
      );

      // Sanitize error for storage — don't expose internal details to users
      const safeMessage = this.sanitizeErrorMessage(rawMessage);

      // Mark profile as failed
      try {
        const profile = await this.profileRepository.findById(
          profileId,
          teamId,
        );
        if (profile && profile.isScanning()) {
          profile.markFailed(safeMessage);
          await this.profileRepository.save(profile);
        }
      } catch {
        // Best effort
      }

      // Mark job as failed
      if (jobId) {
        try {
          const job = await this.jobRepository.findById(jobId, teamId);
          if (job && job.isActive()) {
            job.markFailed(safeMessage);
            await this.jobRepository.save(job);
          }
        } catch {
          // Best effort
        }
      }
    }
  }

  private async updateJobProgress(
    jobId: string,
    teamId: string,
    phase: string,
    percent: number,
  ): Promise<void> {
    try {
      await this.jobRepository.updateProgress(jobId, teamId, phase, percent);
    } catch {
      // Non-critical — progress update failure shouldn't stop the scan
    }
  }

  /**
   * Sanitize error messages for user-facing storage.
   * Strips internal details, caps length.
   */
  private sanitizeErrorMessage(raw: string): string {
    // Map known internal errors to user-friendly messages
    if (raw.includes('ECONNREFUSED') || raw.includes('ETIMEDOUT')) {
      return 'Connection to GitHub failed. Please try again.';
    }
    if (raw.includes('Bad credentials') || raw.includes('401')) {
      return 'GitHub authentication failed. Please reconnect GitHub.';
    }
    if (raw.includes('Not Found') || raw.includes('404')) {
      return 'Repository not found or not accessible.';
    }
    if (raw.includes('rate limit') || raw.includes('403')) {
      return 'GitHub API rate limit exceeded. Please try again later.';
    }
    // Generic fallback — truncate to 200 chars, no stack traces
    const firstLine = raw.split('\n')[0];
    return firstLine.length > 200 ? firstLine.slice(0, 200) + '...' : firstLine;
  }

  /**
   * Check if the job was cancelled. If so, mark the profile as failed
   * so it doesn't stay stuck in 'scanning' forever.
   */
  private async isCancelled(
    jobId: string,
    teamId: string,
    profileId?: string,
  ): Promise<boolean> {
    const status = await this.jobRepository.getStatus(jobId, teamId);
    if (status !== 'cancelled') return false;

    this.logger.log(`Scan job ${jobId} was cancelled`);

    // Clean up profile — mark failed so it's not stuck in 'scanning'
    if (profileId) {
      try {
        const profile = await this.profileRepository.findById(profileId, teamId);
        if (profile && profile.isScanning()) {
          profile.markFailed('Scan cancelled by user');
          await this.profileRepository.save(profile);
        }
      } catch {
        // Best effort
      }
    }

    return true;
  }
}
