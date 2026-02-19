import { CreateTeamUseCase } from './CreateTeamUseCase';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { User } from '../../../users/domain/User';
import { TeamId } from '../../domain/TeamId';
import { InvalidTeamException } from '../../domain/exceptions/InvalidTeamException';

describe('CreateTeamUseCase', () => {
  let useCase: CreateTeamUseCase;
  let mockTeamRepository: jest.Mocked<FirestoreTeamRepository>;
  let mockUserRepository: jest.Mocked<FirestoreUserRepository>;

  beforeEach(() => {
    // Create mock repositories
    mockTeamRepository = {
      save: jest.fn(),
      getById: jest.fn(),
      getBySlug: jest.fn(),
      getByOwnerId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      isSlugUnique: jest.fn(),
    } as any;

    mockUserRepository = {
      getById: jest.fn(),
      save: jest.fn(),
      getByEmail: jest.fn(),
    } as any;

    useCase = new CreateTeamUseCase(mockTeamRepository, mockUserRepository);
  });

  describe('Happy Path', () => {
    it('should create team and add user as member', async () => {
      // Given
      const userId = 'user-123';
      const teamName = 'Acme Engineering';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamName,
      });

      // Then
      expect(result.name).toBe(teamName);
      expect(result.slug).toBe('acme-engineering');
      expect(result.ownerId).toBe(userId);
      expect(result.isOwner).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);

      // Verify user was updated
      const savedUserCall = mockUserRepository.save.mock.calls[0][0];
      expect(savedUserCall.isMemberOfTeam(TeamId.create(result.id))).toBe(true);
    });

    it('should set allowMemberInvites to true by default', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamName: 'Test Team',
      });

      // Then
      expect(result.settings.allowMemberInvites).toBe(true);
    });

    it('should respect allowMemberInvites when provided', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamName: 'Test Team',
        allowMemberInvites: false,
      });

      // Then
      expect(result.settings.allowMemberInvites).toBe(false);
    });

    it('should auto-switch to new team', async () => {
      // Given
      const userId = 'user-123';
      const existingTeamId = TeamId.generate();
      const user = User.create(userId, 'test@example.com', 'Test User').addTeam(existingTeamId);

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamName: 'New Team',
      });

      // Then
      const savedUserCall = mockUserRepository.save.mock.calls[0][0];
      expect(savedUserCall.getCurrentTeamId()!.getValue()).toBe(result.id);
      expect(savedUserCall.getCurrentTeamId()!.getValue()).not.toBe(existingTeamId.getValue());
    });
  });

  describe('Validation', () => {
    it('should reject team name < 3 characters', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');
      mockUserRepository.getById.mockResolvedValue(user);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamName: 'AB',
        })
      ).rejects.toThrow(InvalidTeamException);
    });

    it('should reject team name > 50 characters', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');
      mockUserRepository.getById.mockResolvedValue(user);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamName: 'A'.repeat(51),
        })
      ).rejects.toThrow(InvalidTeamException);
    });

    it('should reject empty team name', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');
      mockUserRepository.getById.mockResolvedValue(user);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamName: '',
        })
      ).rejects.toThrow(InvalidTeamException);
    });

    it('should reject whitespace-only team name', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');
      mockUserRepository.getById.mockResolvedValue(user);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamName: '   ',
        })
      ).rejects.toThrow(InvalidTeamException);
    });
  });

  describe('Uniqueness', () => {
    it('should reject duplicate slug', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(false);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamName: 'ACME',
        })
      ).rejects.toThrow(InvalidTeamException);
    });

    it('should detect duplicate slug case-insensitive', async () => {
      // Given: team with slug "acme-corp" exists
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(false);

      // When: create team "ACME CORP" (same slug after transform)
      await expect(
        useCase.execute({
          userId,
          teamName: 'ACME CORP',
        })
      ).rejects.toThrow(InvalidTeamException);
    });
  });

  describe('Error Cases', () => {
    it('should throw error if user not found', async () => {
      // Given
      mockUserRepository.getById.mockResolvedValue(null);

      // When/Then
      await expect(
        useCase.execute({
          userId: 'nonexistent-user',
          teamName: 'Test Team',
        })
      ).rejects.toThrow('User nonexistent-user not found');
    });

    it('should propagate repository errors', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);
      mockTeamRepository.save.mockRejectedValue(new Error('Database error'));

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamName: 'Test Team',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in team name', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamName: 'Team @ #1!',
      });

      // Then
      expect(result.slug).toBe('team-1');
      expect(result.name).toBe('Team @ #1!');
    });

    it('should trim whitespace from team name', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamName: '  Test Team  ',
      });

      // Then
      expect(result.name).toBe('Test Team');
    });

    it('should handle user with no teams (first team)', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      await useCase.execute({
        userId,
        teamName: 'First Team',
      });

      // Then
      const savedUserCall = mockUserRepository.save.mock.calls[0][0];
      expect(savedUserCall.hasTeams()).toBe(true);
      expect(savedUserCall.getCurrentTeamId()).not.toBeNull();
    });
  });
});
