import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

@Injectable()
export class JiraTokenService {
  private readonly logger = new Logger(JiraTokenService.name);
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('GITHUB_ENCRYPTION_KEY');
    if (!key) {
      throw new Error('GITHUB_ENCRYPTION_KEY environment variable is required');
    }
    this.encryptionKey = key;
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

  private async getDerivedKey(): Promise<Buffer> {
    return (await scryptAsync(this.encryptionKey, 'salt', 32)) as Buffer;
  }
}
