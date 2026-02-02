/**
 * GitHubTokenService Unit Tests
 * Part of: Story 4.1 - Task 12
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GitHubTokenService } from '../github-token.service';

describe('GitHubTokenService', () => {
  let service: GitHubTokenService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubTokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                GITHUB_CLIENT_ID: 'test-client-id',
                GITHUB_CLIENT_SECRET: 'test-client-secret',
                GITHUB_ENCRYPTION_KEY: 'test-encryption-key-32-chars!!',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GitHubTokenService>(GitHubTokenService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encryptToken and decryptToken', () => {
    it('should encrypt and decrypt a token correctly', async () => {
      const originalToken = 'gho_test_token_1234567890';

      const encrypted = await service.encryptToken(originalToken);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalToken);
      expect(encrypted).toContain(':'); // IV:encrypted format

      const decrypted = await service.decryptToken(encrypted);
      expect(decrypted).toBe(originalToken);
    });

    it('should produce different encrypted values for the same token (due to random IV)', async () => {
      const token = 'gho_test_token';

      const encrypted1 = await service.encryptToken(token);
      const encrypted2 = await service.encryptToken(token);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same value
      const decrypted1 = await service.decryptToken(encrypted1);
      const decrypted2 = await service.decryptToken(encrypted2);

      expect(decrypted1).toBe(token);
      expect(decrypted2).toBe(token);
    });

    it('should throw error when decrypting invalid format', async () => {
      await expect(service.decryptToken('invalid-format')).rejects.toThrow('Failed to decrypt token');
    });
  });

  describe('generateState', () => {
    it('should generate a random state of at least 32 characters', () => {
      const state1 = service.generateState();
      const state2 = service.generateState();

      expect(state1).toBeDefined();
      expect(state1.length).toBeGreaterThanOrEqual(32);
      expect(state2).toBeDefined();
      expect(state2.length).toBeGreaterThanOrEqual(32);
      expect(state1).not.toBe(state2); // Should be random
    });
  });

  describe('validateState', () => {
    it('should return true for matching states', () => {
      const state = service.generateState();
      expect(service.validateState(state, state)).toBe(true);
    });

    it('should return false for non-matching states', () => {
      const state1 = service.generateState();
      const state2 = service.generateState();
      expect(service.validateState(state1, state2)).toBe(false);
    });

    it('should return false for states shorter than 32 characters', () => {
      expect(service.validateState('short', 'short')).toBe(false);
    });
  });
});
