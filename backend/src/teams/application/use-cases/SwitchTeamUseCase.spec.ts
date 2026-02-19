import { ForbiddenException } from '@nestjs/common';
import { SwitchTeamUseCase } from './SwitchTeamUseCase';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { User } from '../../../users/domain/User';
import { Team } from '../../domain/Team';
import { TeamId } from '../../domain/TeamId';
import { TeamSettings } from '../../domain/TeamSettings';

describe('SwitchTeamUseCase', () => {
  let useCase: SwitchTeamUseCase;
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

    useCase = new SwitchTeamUseCase(mockTeamRepository, mockUserRepository);
  });

  describe('Happy Path', () => {
    it('should switch user to target team', async () => {
      // Given: user is member of teamA and teamB
      const userId = 'user-123';
      const teamAId = TeamId.generate();
      const teamBId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamAId)
        .switchTeam(teamAId) // Currently on teamA
        .addTeam(teamBId);

      const teamB = Team.create('Team B', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(teamB);

      // When: switch to teamB
      const result = await useCase.execute({
        userId,
        teamId: teamBId.getValue(),
      });

      // Then
      expect(result.currentTeamId).toBe(teamBId.getValue());
      expect(result.teamName).toBe('Team B');

      // Verify user was updated
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.getCurrentTeamId()!.getValue()).toBe(teamBId.getValue());
    });

    it('should allow switching to already current team (no-op)', async () => {
      // Given: user already on teamA
      const userId = 'user-123';
      const teamAId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamAId)
        .switchTeam(teamAId);

      const teamA = Team.create('Team A', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(teamA);

      // When: switch to teamA again
      const result = await useCase.execute({
        userId,
        teamId: teamAId.getValue(),
      });

      // Then: still on teamA
      expect(result.currentTeamId).toBe(teamAId.getValue());
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authorization', () => {
    it('should reject switch if user not member', async () => {
      // Given: user NOT member of teamX
      const userId = 'user-123';
      const teamXId = TeamId.generate();
      const ownTeamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(ownTeamId);

      const teamX = Team.create('Team X', 'other-user', TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(teamX);

      // When: try to switch to teamX
      await expect(
        useCase.execute({
          userId,
          teamId: teamXId.getValue(),
        })
      ).rejects.toThrow(ForbiddenException);
      await expect(
        useCase.execute({
          userId,
          teamId: teamXId.getValue(),
        })
      ).rejects.toThrow('You are not a member of this team');
    });

    it('should reject if user has no teams at all', async () => {
      // Given: user with no teams
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User');
      const team = Team.create('Team A', 'other-user', TeamSettings.create(undefined, true));

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
    it('should throw error if team does not exist', async () => {
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

    it('should throw error if user does not exist', async () => {
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

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

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
    it('should handle user with only one team (switching to self)', async () => {
      // Given: user with only one team
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      const team = Team.create('Only Team', userId, TeamSettings.create(undefined, true));

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When
      const result = await useCase.execute({
        userId,
        teamId: teamId.getValue(),
      });

      // Then
      expect(result.currentTeamId).toBe(teamId.getValue());
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should handle user switching between multiple teams rapidly', async () => {
      // Given: user with 3 teams
      const userId = 'user-123';
      const team1Id = TeamId.generate();
      const team2Id = TeamId.generate();
      const team3Id = TeamId.generate();

      let user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(team1Id)
        .addTeam(team2Id)
        .addTeam(team3Id)
        .switchTeam(team1Id);

      const team2 = Team.create('Team 2', userId, TeamSettings.create(undefined, true));
      const team3 = Team.create('Team 3', userId, TeamSettings.create(undefined, true));

      // When: switch to team2, then team3
      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team2);

      const result1 = await useCase.execute({
        userId,
        teamId: team2Id.getValue(),
      });

      expect(result1.currentTeamId).toBe(team2Id.getValue());

      // Update user for second switch
      user = user.switchTeam(team2Id);
      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team3);

      const result2 = await useCase.execute({
        userId,
        teamId: team3Id.getValue(),
      });

      expect(result2.currentTeamId).toBe(team3Id.getValue());
    });

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
      expect(result.teamName).toBe('Team @ #1!');
    });
  });
});
