/**
 * GitHub App Token Service
 *
 * Generates short-lived installation access tokens for GitHub App integrations.
 * Uses RS256-signed JWTs to authenticate as the GitHub App, then exchanges
 * them for installation-scoped access tokens.
 *
 * Part of: P0-4 - GitHub App Token Generation
 * Layer: Application (business logic)
 */

import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface InstallationToken {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class GitHubAppTokenService {
  private readonly logger = new Logger(GitHubAppTokenService.name);
  private cachedTokens = new Map<number, InstallationToken>();

  /**
   * Generate a short-lived installation access token for a GitHub App installation.
   * Tokens are cached and reused until 5 minutes before expiry.
   */
  async getInstallationToken(installationId: number): Promise<string> {
    // Check cache
    const cached = this.cachedTokens.get(installationId);
    if (cached && cached.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
      return cached.token;
    }

    // Generate JWT signed with App private key
    const appJwt = this.generateAppJwt();

    // Exchange JWT for installation token
    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${appJwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to get installation token: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { token: string; expires_at: string };

    const installationToken: InstallationToken = {
      token: data.token,
      expiresAt: new Date(data.expires_at),
    };

    this.cachedTokens.set(installationId, installationToken);
    this.logger.log(
      `Generated installation token for installation ${installationId}, expires ${data.expires_at}`,
    );

    return installationToken.token;
  }

  /**
   * Get the first (and typically only) GitHub App installation.
   * Used as a fallback when no installation ID is stored in Firestore.
   * Returns null if no installations exist or if the app is not configured.
   */
  async getFirstInstallationId(): Promise<number | null> {
    try {
      const appJwt = this.generateAppJwt();

      const response = await fetch('https://api.github.com/app/installations', {
        headers: {
          Authorization: `Bearer ${appJwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`Failed to list GitHub App installations: ${response.status} ${body}`);
        return null;
      }

      const installations = (await response.json()) as Array<{ id: number; account: { login: string } }>;

      if (!installations || installations.length === 0) {
        this.logger.warn('No GitHub App installations found');
        return null;
      }

      this.logger.log(
        `Found ${installations.length} GitHub App installation(s). Using first: ${installations[0].id} (${installations[0].account?.login})`,
      );

      return installations[0].id;
    } catch (error) {
      this.logger.warn(`Failed to list GitHub App installations: ${error}`);
      return null;
    }
  }

  /**
   * Create a pull request on GitHub using an installation token.
   * Returns the PR URL and number, or null if creation fails.
   */
  async createPullRequest(params: {
    installationId: number;
    owner: string;
    repo: string;
    head: string;
    base: string;
    title: string;
    body: string;
  }): Promise<{ prUrl: string; prNumber: number } | null> {
    try {
      // Validate owner/repo to prevent SSRF via path traversal
      const SAFE_REPO_PATTERN = /^[a-zA-Z0-9._-]+$/;
      if (!SAFE_REPO_PATTERN.test(params.owner) || !SAFE_REPO_PATTERN.test(params.repo)) {
        throw new Error('Invalid repository owner or name');
      }

      const token = await this.getInstallationToken(params.installationId);

      const response = await fetch(
        `https://api.github.com/repos/${params.owner}/${params.repo}/pulls`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: params.title,
            body: params.body,
            head: params.head,
            base: params.base,
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.warn(`Failed to create PR: ${response.status} ${errorBody}`);
        return null;
      }

      const data = (await response.json()) as { html_url: string; number: number };
      this.logger.log(`Created PR #${data.number} for ${params.owner}/${params.repo}: ${data.html_url}`);
      return { prUrl: data.html_url, prNumber: data.number };
    } catch (error) {
      this.logger.warn(`PR creation failed: ${error}`);
      return null;
    }
  }

  /**
   * Generate a JWT signed with the GitHub App's private key.
   * Valid for 10 minutes (GitHub's maximum).
   */
  private generateAppJwt(): string {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!appId || !privateKey) {
      throw new Error('GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set');
    }

    // Handle \n in env var (common when stored as single line)
    const formattedKey = privateKey.replace(/\\n/g, '\n');

    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        iat: now - 60, // 60 seconds in the past (clock skew)
        exp: now + 600, // 10 minutes
        iss: appId,
      },
      formattedKey,
      { algorithm: 'RS256' },
    );
  }
}
