import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';
import { scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface LinearTokenResponse {
  accessToken: string;
  tokenType: string;
  scope: string;
}

export interface LinearUserInfo {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class LinearTokenService {
  private readonly logger = new Logger(LinearTokenService.name);
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('GITHUB_ENCRYPTION_KEY') || '';
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<LinearTokenResponse> {
    const clientId = this.configService.get<string>('LINEAR_CLIENT_ID');
    const clientSecret = this.configService.get<string>('LINEAR_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Linear OAuth credentials not configured');
    }

    const response = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Linear token exchange failed: ${text}`);
    }

    const data = (await response.json()) as any;

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope || '',
    };
  }

  async getUserInfo(accessToken: string): Promise<LinearUserInfo> {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: '{ viewer { id name email } }',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Linear user info: ${response.statusText}`);
    }

    const { data } = (await response.json()) as any;
    return {
      id: data.viewer.id,
      name: data.viewer.name,
      email: data.viewer.email,
    };
  }

  async encryptToken(token: string): Promise<string> {
    const key = await this.getDerivedKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  async decryptToken(encryptedToken: string): Promise<string> {
    const parts = encryptedToken.split(':');
    if (parts.length !== 2) throw new Error('Invalid encrypted token format');
    const iv = Buffer.from(parts[0], 'hex');
    const key = await this.getDerivedKey();
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  generateSignedState(workspaceId: string): string {
    const nonce = randomBytes(16).toString('hex');
    const payload = `${nonce}.${workspaceId}`;
    const hmac = this.computeHmac(payload);
    return `${payload}.${hmac}`;
  }

  parseSignedState(state: string): { workspaceId: string; nonce: string } | null {
    const parts = state.split('.');
    if (parts.length !== 3) return null;
    const [nonce, workspaceId, hmac] = parts;
    const expected = this.computeHmac(`${nonce}.${workspaceId}`);
    if (hmac !== expected) return null;
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
