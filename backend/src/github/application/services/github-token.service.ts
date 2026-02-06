/**
 * GitHub Token Service
 * 
 * Handles GitHub OAuth token operations:
 * - Exchange authorization code for access token
 * - Token encryption/decryption for secure storage
 * - Token refresh (if applicable)
 * 
 * Part of: Story 4.1 - GitHub App Integration
 * Layer: Application (business logic)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createCipheriv, createDecipheriv, randomBytes, scrypt, createHmac } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface GitHubTokenResponse {
  accessToken: string;
  tokenType: string;
  scope: string;
}

export interface GitHubUserInfo {
  login: string;
  type: 'User' | 'Organization';
  id: number;
}

@Injectable()
export class GitHubTokenService {
  private readonly logger = new Logger(GitHubTokenService.name);
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('GITHUB_ENCRYPTION_KEY') || '';
    
    if (!this.encryptionKey) {
      this.logger.warn('GITHUB_ENCRYPTION_KEY not set - token encryption will use default (INSECURE)');
    }
  }

  /**
   * Exchange OAuth authorization code for access token
   * AC#3: Exchange code for token
   */
  async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }

    try {
      this.logger.log('Exchanging authorization code for access token');

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json() as any;

      if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
      };
    } catch (error: any) {
      this.logger.error('Failed to exchange code for token:', error.message);
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Get authenticated user information
   * AC#3: Fetch user info with token
   */
  async getUserInfo(accessToken: string): Promise<GitHubUserInfo> {
    try {
      const octokit = new Octokit({ auth: accessToken });
      const { data } = await octokit.rest.users.getAuthenticated();

      return {
        login: data.login,
        type: data.type === 'Organization' ? 'Organization' : 'User',
        id: data.id,
      };
    } catch (error: any) {
      this.logger.error('Failed to fetch user info:', error.message);
      throw new Error(`Failed to fetch user info: ${error.message}`);
    }
  }

  /**
   * Encrypt access token for secure storage
   * AC#3: Tokens stored encrypted
   */
  async encryptToken(token: string): Promise<string> {
    try {
      const key = await this.getDerivedKey();
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', key, iv);

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Return IV + encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error: any) {
      this.logger.error('Token encryption failed:', error.message);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt access token from storage
   * AC#3: Token decryption
   */
  async decryptToken(encryptedToken: string): Promise<string> {
    try {
      const parts = encryptedToken.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted token format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = await this.getDerivedKey();

      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      this.logger.error('Token decryption failed:', error.message);
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Validate OAuth state parameter
   * AC#8: OAuth state validation to prevent CSRF
   */
  validateState(providedState: string, expectedState: string): boolean {
    return providedState === expectedState && expectedState.length >= 32;
  }

  /**
   * Generate random OAuth state parameter
   */
  generateState(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate a signed state parameter that embeds the workspaceId.
   * Format: nonce.workspaceId.hmac
   * This allows the callback to extract workspaceId without relying on sessions.
   */
  generateSignedState(workspaceId: string): string {
    const nonce = randomBytes(16).toString('hex');
    const payload = `${nonce}.${workspaceId}`;
    const hmac = this.computeHmac(payload);
    return `${payload}.${hmac}`;
  }

  /**
   * Parse and verify a signed state parameter.
   * Returns the workspaceId if valid, null if tampered or malformed.
   */
  parseSignedState(state: string): { workspaceId: string; nonce: string } | null {
    const parts = state.split('.');
    if (parts.length !== 3) {
      this.logger.error('Signed state has wrong number of parts');
      return null;
    }

    const [nonce, workspaceId, hmac] = parts;
    const payload = `${nonce}.${workspaceId}`;
    const expectedHmac = this.computeHmac(payload);

    if (hmac !== expectedHmac) {
      this.logger.error('Signed state HMAC verification failed');
      return null;
    }

    return { workspaceId, nonce };
  }

  private computeHmac(data: string): string {
    const secret = this.encryptionKey || 'default-insecure-key-change-me';
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  private async getDerivedKey(): Promise<Buffer> {
    const key = this.encryptionKey || 'default-insecure-key-change-me';
    return (await scryptAsync(key, 'salt', 32)) as Buffer;
  }
}
