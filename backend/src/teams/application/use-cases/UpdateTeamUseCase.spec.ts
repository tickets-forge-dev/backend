import { ForbiddenException } from '@nestjs/common';
import { UpdateTeamUseCase } from './UpdateTeamUseCase';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { User } from '../../../users/domain/User';
import { Team } from '../../domain/Team';
import { TeamId } from '../../domain/TeamId';
import { TeamSettings } from '../../domain/TeamSettings';
import { InvalidTeamException } from '../../domain/exceptions/InvalidTeamException';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';

describe('UpdateTeamUseCase', () => {
  let useCase: UpdateTeamUseCase;
  let mockTeamRepository: jest.Mocked<FirestoreTeamRepository>;
  let mockUserRepository: jest.Mocked<FirestoreUserRepository>;

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
      save: jest.fn(),
      getByEmail: jest.fn(),
    } as any;

    useCase = new UpdateTeamUseCase(mockTeamRepository, mockUserRepository);
  });

  describe('Happy Path - Owner Updates', () => {
    it('should update team name (owner only)', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Old Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
        teamName: 'New Name',
      });

      // Then
      expect(result.name).toBe('New Name');
      expect(result.slug).toBe('new-name');
      expect(mockTeamRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should update settings only', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Team Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
        settings: {
          allowMemberInvites: false,
        },
      });

      // Then
      expect(result.settings.allowMemberInvites).toBe(false);
      expect(mockTeamRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should update both name and settings', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Old Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
        teamName: 'New Name',
        settings: {
          defaultWorkspaceId: 'workspace-1',
          allowMemberInvites: false,
        },
      });

      // Then
      expect(result.name).toBe('New Name');
      expect(result.settings.allowMemberInvites).toBe(false);
      expect(result.settings.defaultWorkspaceId).toBe('workspace-1');
    });

    it('should allow updating with same name (no slug change)', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Team Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When: update with same name
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
        teamName: 'Team Name',
      });

      // Then: should succeed (no slug uniqueness check needed)
      expect(result.name).toBe('Team Name');
      expect(mockTeamRepository.isSlugUnique).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - Owner Only', () => {
    it('should reject if user is not owner', async () => {
      // Given: user is member but NOT owner
      const userId = 'user-123';
      const ownerId = 'owner-456';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Team Name', ownerId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'New Name',
        })
      ).rejects.toThrow(ForbiddenException);
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'New Name',
        })
      ).rejects.toThrow('Only team owners can update team settings');
    });

    it('should reject if user not member at all', async () => {
      // Given: user NOT member of team
      const userId = 'user-123';
      const ownerId = 'owner-456';
      const teamId = TeamId.generate();
      const otherTeamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(otherTeamId); // Member of different team

      const team = Team.create('Team Name', ownerId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'New Name',
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Validation', () => {
    it('should validate new team name length', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Old Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When: name too short
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'AB',
        })
      ).rejects.toThrow(InvalidTeamException);

      // When: name too long
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'A'.repeat(51),
        })
      ).rejects.toThrow(InvalidTeamException);
    });

    it('should check slug uniqueness if name changed', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Old Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);
      mockTeamRepository.isSlugUnique.mockResolvedValue(false); // Slug taken

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'Taken Name',
        })
      ).rejects.toThrow(InvalidTeamException);
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'Taken Name',
        })
      ).rejects.toThrow('already taken');
    });

    it('should allow slug to stay same when only changing settings', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Team Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When: only update settings
      await useCase.execute({
        userId,
        teamId: teamId.getValue(),
        settings: {
          allowMemberInvites: false,
        },
      });

      // Then: slug uniqueness not checked
      expect(mockTeamRepository.isSlugUnique).not.toHaveBeenCalled();
    });
  });

  describe('Error Cases', () => {
    it('should throw error if team not found', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(null);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'New Name',
        })
      ).rejects.toThrow(`Team ${teamId.getValue()} not found`);
    });

    it('should throw error if user not found', async () => {
      // Given
      mockUserRepository.getById.mockResolvedValue(null);

      // When/Then
      await expect(
        useCase.execute({
          userId: 'nonexistent-user',
          teamId: 'some-team-id',
          teamName: 'New Name',
        })
      ).rejects.toThrow('User nonexistent-user not found');
    });

    it('should handle repository update failure', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Old Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);
      mockTeamRepository.update.mockRejectedValue(new Error('Database error'));

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
          teamName: 'New Name',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace trimming in new name', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Old Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
        teamName: '  New Name  ',
      });

      // Then
      expect(result.name).toBe('New Name');
    });

    it('should handle special characters in new name', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Old Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);
      mockTeamRepository.isSlugUnique.mockResolvedValue(true);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
        teamName: 'Team @ #1!',
      });

      // Then
      expect(result.name).toBe('Team @ #1!');
      expect(result.slug).toBe('team-1');
    });

    it('should handle no changes provided (no-op)', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Team Name', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When: no teamName or settings provided
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
      });

      // Then: should still succeed (return current values)
      expect(result.name).toBe('Team Name');
      expect(mockTeamRepository.update).toHaveBeenCalled();
    });
  });
});
