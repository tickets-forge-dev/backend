import { ForbiddenException } from '@nestjs/common';
import { GetTeamUseCase } from './GetTeamUseCase';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { User } from '../../../users/domain/User';
import { Team } from '../../domain/Team';
import { TeamId } from '../../domain/TeamId';
import { TeamSettings } from '../../domain/TeamSettings';

describe('GetTeamUseCase', () => {
  let useCase: GetTeamUseCase;
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

    useCase = new GetTeamUseCase(mockTeamRepository, mockUserRepository);
  });

  describe('Happy Path', () => {
    it('should return team with isOwner=true for owner', async () => {
      // Given: user is owner of team
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
      });

      // Then
      expect(result.name).toBe('Team Name');
      expect(result.isOwner).toBe(true);
      expect(result.ownerId).toBe(userId);
    });

    it('should return team with isOwner=false for member', async () => {
      // Given: user is member but NOT owner
      const userId = 'user-123';
      const ownerId = 'owner-456';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Team Name', ownerId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
      });

      // Then
      expect(result.name).toBe('Team Name');
      expect(result.isOwner).toBe(false);
      expect(result.ownerId).toBe(ownerId);
    });

    it('should return complete team data', async () => {
      // Given
      const userId = 'user-123';
      const team = Team.create('Team Name', userId, TeamSettings.create('workspace-1', false));
      const teamId = team.getId();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
      });

      // Then
      expect(result.id).toBe(team.getId().getValue());
      expect(result.name).toBe('Team Name');
      expect(result.slug).toBe('team-name');
      expect(result.settings.defaultWorkspaceId).toBe('workspace-1');
      expect(result.settings.allowMemberInvites).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('Authorization', () => {
    it('should reject if user not member', async () => {
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
        })
      ).rejects.toThrow(ForbiddenException);
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
        })
      ).rejects.toThrow('You are not a member of this team');
    });

    it('should reject if user has no teams', async () => {
      // Given: user with no teams
      const userId = 'user-123';
      const ownerId = 'owner-456';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User');
      const team = Team.create('Team Name', ownerId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Error Cases', () => {
    it('should throw error if team not found', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(null);

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
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
        })
      ).rejects.toThrow('User nonexistent-user not found');
    });

    it('should propagate repository errors', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockRejectedValue(new Error('Database error'));

      // When/Then
      await expect(
        useCase.execute({
          userId,
          teamId: teamId.getValue(),
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle team with special characters in name', async () => {
      // Given
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Team @ #1!', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
      });

      // Then
      expect(result.name).toBe('Team @ #1!');
      expect(result.slug).toBe('team-1');
    });

    it('should handle team with no default workspace', async () => {
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
      });

      // Then
      expect(result.settings.defaultWorkspaceId).toBeUndefined();
    });
  });
});
