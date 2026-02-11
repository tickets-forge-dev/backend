/**
 * Unit Tests for BulkEnrichDto Validation
 *
 * Tests request DTO validation including:
 * - Array size constraints
 * - String format validation
 * - Required field validation
 */

import { validate } from 'class-validator';
import { BulkEnrichDto } from '../BulkEnrichDto';

describe('BulkEnrichDto', () => {
  describe('ticketIds validation', () => {
    it('should accept valid ticketIds array', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: ['ticket-1', 'ticket-2', 'ticket-3'],
        repositoryOwner: 'owner',
        repositoryName: 'repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should reject empty ticketIds array', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: [],
        repositoryOwner: 'owner',
        repositoryName: 'repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const arrayMinError = errors.find((e) => e.constraints?.['arrayMinSize']);
      expect(arrayMinError?.constraints?.['arrayMinSize']).toContain('At least one ticket ID is required');
    });

    it('should reject ticketIds array with more than 100 items', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: Array.from({ length: 101 }, (_, i) => `ticket-${i + 1}`),
        repositoryOwner: 'owner',
        repositoryName: 'repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const arrayMaxError = errors.find((e) => e.constraints?.['arrayMaxSize']);
      expect(arrayMaxError?.constraints?.['arrayMaxSize']).toContain(
        'Cannot enrich more than 100 tickets at a time',
      );
    });

    it('should accept exactly 100 ticketIds', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: Array.from({ length: 100 }, (_, i) => `ticket-${i + 1}`),
        repositoryOwner: 'owner',
        repositoryName: 'repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should reject ticketIds with non-string values', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: ['ticket-1', 123 as any, 'ticket-3'],
        repositoryOwner: 'owner',
        repositoryName: 'repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject ticketIds with empty strings', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: ['ticket-1', '', 'ticket-3'],
        repositoryOwner: 'owner',
        repositoryName: 'repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('repositoryOwner validation', () => {
    it('should accept valid repositoryOwner', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: ['ticket-1'],
        repositoryOwner: 'octocat',
        repositoryName: 'repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.filter((e) => e.property === 'repositoryOwner')).toHaveLength(0);
    });

    it('should reject empty repositoryOwner', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: ['ticket-1'],
        repositoryOwner: '',
        repositoryName: 'repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.filter((e) => e.property === 'repositoryOwner')).toHaveLength(1);
    });
  });

  describe('repositoryName validation', () => {
    it('should accept valid repositoryName', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: ['ticket-1'],
        repositoryOwner: 'owner',
        repositoryName: 'my-repo',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.filter((e) => e.property === 'repositoryName')).toHaveLength(0);
    });

    it('should reject empty repositoryName', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: ['ticket-1'],
        repositoryOwner: 'owner',
        repositoryName: '',
        branch: 'main',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.filter((e) => e.property === 'repositoryName')).toHaveLength(1);
    });
  });

  describe('branch validation', () => {
    it('should accept valid branch names', async () => {
      // Arrange
      const validBranches = ['main', 'develop', 'feature/auth', 'release-v1.0', 'fix_bug_123'];

      for (const branch of validBranches) {
        const dto = Object.assign(new BulkEnrichDto(), {
          ticketIds: ['ticket-1'],
          repositoryOwner: 'owner',
          repositoryName: 'repo',
          branch,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors.filter((e) => e.property === 'branch')).toHaveLength(0, `Branch ${branch} should be valid`);
      }
    });

    it('should reject invalid branch names (with special characters)', async () => {
      // Arrange
      const invalidBranches = ['main@', 'feature#auth', 'release$v1.0', 'fix&bug'];

      for (const branch of invalidBranches) {
        const dto = Object.assign(new BulkEnrichDto(), {
          ticketIds: ['ticket-1'],
          repositoryOwner: 'owner',
          repositoryName: 'repo',
          branch,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors.filter((e) => e.property === 'branch').length).toBeGreaterThan(
          0,
          `Branch ${branch} should be invalid`,
        );
      }
    });

    it('should reject empty branch', async () => {
      // Arrange
      const dto = Object.assign(new BulkEnrichDto(), {
        ticketIds: ['ticket-1'],
        repositoryOwner: 'owner',
        repositoryName: 'repo',
        branch: '',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.filter((e) => e.property === 'branch')).toHaveLength(1);
    });
  });
});
