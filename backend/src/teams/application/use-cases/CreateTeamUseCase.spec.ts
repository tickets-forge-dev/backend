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
  let mockMemberRepository: jest.Mocked<{ save: jest.Mock }>;

  beforeEach(() => {
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
      save: jest.fn().mockResolvedValue(undefined),
      getByEmail: jest.fn(),
    } as any;

    mockMemberRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new CreateTeamUseCase(mockTeamRepository, mockUserRepository, mockMemberRepository as any);
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
        userEmail: 'test@example.com',
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
      expect(mockMemberRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);

      // Verify user was updated with team membership
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
        userEmail: 'test@example.com',
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
        userEmail: 'test@example.com',
        teamName: 'Test Team',
        allowMemberInvites: false,
      });

      // Then
      expect(result.settings.allowMemberInvites).toBe(false);
    });

    it('should auto-switch to new team when user already belongs to a team', async () => {
      // Given
      const userId = 'user-123';
      const existingTeamId = TeamId.generate();
      const user = User.create(userId, 'test@example.com', 'Test User').addTeam(existingTeamId);

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        userEmail: 'test@example.com',
        teamName: 'New Team',
      });

      // Then: last save call should have the new team as current
      const savedUserCall = mockUserRepository.save.mock.calls[mockUserRepository.save.mock.calls.length - 1][0];
      expect(savedUserCall.getCurrentTeamId()!.getValue()).toBe(result.id);
      expect(savedUserCall.getCurrentTeamId()!.getValue()).not.toBe(existingTeamId.getValue());
    });
  });

  describe('Auto-create User', () => {
    it('should auto-create user in Firestore when not found (Firebase Auth sync)', async () => {
      // Given: user exists in Firebase Auth but not in Firestore yet
      mockUserRepository.getById.mockResolvedValue(null);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId: 'new-firebase-user',
        userEmail: 'new@example.com',
        userDisplayName: 'New User',
        teamName: 'My Team',
      });

      // Then: user was auto-created and team was created successfully
      expect(result.name).toBe('My Team');
      expect(result.ownerId).toBe('new-firebase-user');
      // userRepository.save called twice: once for auto-create, once for team membership
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
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
        useCase.execute({ userId, userEmail: 'test@example.com', teamName: 'AB' })
      ).rejects.toThrow(InvalidTeamException);
    });

    it('should reject team name > 50 characters', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');
      mockUserRepository.getById.mockResolvedValue(user);

      // When/Then
      await expect(
        useCase.execute({ userId, userEmail: 'test@example.com', teamName: 'A'.repeat(51) })
      ).rejects.toThrow(InvalidTeamException);
    });

    it('should reject empty team name', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');
      mockUserRepository.getById.mockResolvedValue(user);

      // When/Then
      await expect(
        useCase.execute({ userId, userEmail: 'test@example.com', teamName: '' })
      ).rejects.toThrow(InvalidTeamException);
    });

    it('should reject whitespace-only team name', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');
      mockUserRepository.getById.mockResolvedValue(user);

      // When/Then
      await expect(
        useCase.execute({ userId, userEmail: 'test@example.com', teamName: '   ' })
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
        useCase.execute({ userId, userEmail: 'test@example.com', teamName: 'ACME' })
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
        useCase.execute({ userId, userEmail: 'test@example.com', teamName: 'ACME CORP' })
      ).rejects.toThrow(InvalidTeamException);
    });
  });

  describe('Error Cases', () => {
    it('should propagate repository errors from teamRepository.save', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);
      mockTeamRepository.save.mockRejectedValue(new Error('Database error'));

      // When/Then
      await expect(
        useCase.execute({ userId, userEmail: 'test@example.com', teamName: 'Test Team' })
      ).rejects.toThrow('Database error');
    });

    it('should propagate errors from memberRepository.save', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);
      mockMemberRepository.save.mockRejectedValue(new Error('Member save failed'));

      // When/Then
      await expect(
        useCase.execute({ userId, userEmail: 'test@example.com', teamName: 'Test Team' })
      ).rejects.toThrow('Member save failed');
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
        userEmail: 'test@example.com',
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
        userEmail: 'test@example.com',
        teamName: '  Test Team  ',
      });

      // Then
      expect(result.name).toBe('Test Team');
    });

    it('should handle user with no teams (first team) — sets as current team', async () => {
      // Given
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      await useCase.execute({
        userId,
        userEmail: 'test@example.com',
        teamName: 'First Team',
      });

      // Then: last save has the user with team membership
      const savedUserCall = mockUserRepository.save.mock.calls[mockUserRepository.save.mock.calls.length - 1][0];
      expect(savedUserCall.hasTeams()).toBe(true);
      expect(savedUserCall.getCurrentTeamId()).not.toBeNull();
    });
  });
});
