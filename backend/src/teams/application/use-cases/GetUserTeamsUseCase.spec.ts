import { GetUserTeamsUseCase } from './GetUserTeamsUseCase';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { User } from '../../../users/domain/User';
import { Team } from '../../domain/Team';
import { TeamId } from '../../domain/TeamId';
import { TeamSettings } from '../../domain/TeamSettings';

describe('GetUserTeamsUseCase', () => {
  let useCase: GetUserTeamsUseCase;
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

    const mockSyncUserTeamsUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new GetUserTeamsUseCase(mockTeamRepository, mockUserRepository, mockSyncUserTeamsUseCase as any);
  });

  describe('Happy Path', () => {
    it('should return all teams for user', async () => {
      // Given: user with 2 teams
      const userId = 'user-123';
      const team1 = Team.create('Team One', userId, TeamSettings.create(undefined, true));
      const team2 = Team.create('Team Two', 'other-user', TeamSettings.create(undefined, true));

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(team1.getId())
        .addTeam(team2.getId())
        .switchTeam(team1.getId());

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById
        .mockResolvedValueOnce(team1)
        .mockResolvedValueOnce(team2);

      // When
      const result = await useCase.execute({ userId });

      // Then
      expect(result.teams).toHaveLength(2);
      expect(result.currentTeamId).toBe(team1.getId().getValue());
    });

    it('should mark current team with isCurrent=true', async () => {
      // Given
      const userId = 'user-123';
      const team1 = Team.create('Team One', userId, TeamSettings.create(undefined, true));
      const team2 = Team.create('Team Two', 'other-user', TeamSettings.create(undefined, true));

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(team1.getId())
        .addTeam(team2.getId())
        .switchTeam(team1.getId());

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById
        .mockResolvedValueOnce(team1)
        .mockResolvedValueOnce(team2);

      // When
      const result = await useCase.execute({ userId });

      // Then
      const currentTeam = result.teams.find((t) => t.isCurrent);
      expect(currentTeam).toBeDefined();
      expect(currentTeam!.id).toBe(team1.getId().getValue());
      expect(currentTeam!.isCurrent).toBe(true);

      const otherTeam = result.teams.find((t) => !t.isCurrent);
      expect(otherTeam!.isCurrent).toBe(false);
    });

    it('should return empty array if user has no teams', async () => {
      // Given: user with no teams
      const userId = 'user-123';
      const user = User.create(userId, 'test@example.com', 'Test User');

      mockUserRepository.getById.mockResolvedValue(user);
      // Self-healing path: getByOwnerId called to check for orphaned owned teams
      mockTeamRepository.getByOwnerId.mockResolvedValue([]);

      // When
      const result = await useCase.execute({ userId });

      // Then
      expect(result.teams).toHaveLength(0);
      expect(result.currentTeamId).toBeNull();
    });

    it('should include isOwner flag for each team', async () => {
      // Given: user owns team1, member of team2
      const userId = 'user-123';
      const team1 = Team.create('Team One', userId, TeamSettings.create(undefined, true));
      const team2 = Team.create('Team Two', 'other-user', TeamSettings.create(undefined, true));

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(team1.getId())
        .addTeam(team2.getId());

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById
        .mockResolvedValueOnce(team1)
        .mockResolvedValueOnce(team2);

      // When
      const result = await useCase.execute({ userId });

      // Then
      const ownedTeam = result.teams.find((t) => t.id === team1.getId().getValue());
      expect(ownedTeam!.isOwner).toBe(true);

      const memberTeam = result.teams.find((t) => t.id === team2.getId().getValue());
      expect(memberTeam!.isOwner).toBe(false);
    });
  });

  describe('Error Cases', () => {
    it('should return empty teams if user not found (race condition with auth/init)', async () => {
      // Given: user exists in Firebase Auth but Firestore doc not created yet
      mockUserRepository.getById.mockResolvedValue(null);

      // When
      const result = await useCase.execute({ userId: 'nonexistent-user' });

      // Then: returns empty gracefully instead of throwing
      expect(result.teams).toHaveLength(0);
      expect(result.currentTeamId).toBeNull();
    });

    it('should handle team not found gracefully', async () => {
      // Given: user references team that doesn't exist
      const userId = 'user-123';
      const teamId = TeamId.generate();

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(teamId);

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(null); // Team not found

      // When
      const result = await useCase.execute({ userId });

      // Then: should skip missing team
      expect(result.teams).toHaveLength(0);
    });

    it('should propagate repository errors', async () => {
      // Given
      mockUserRepository.getById.mockRejectedValue(new Error('Database error'));

      // When/Then
      await expect(
        useCase.execute({ userId: 'user-123' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no currentTeamId', async () => {
      // Given: user has teams but no currentTeamId
      const userId = 'user-123';
      const team1 = Team.create('Team One', userId, TeamSettings.create(undefined, true));

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(team1.getId());
      // Note: Not calling switchTeam, so currentTeamId should be team1.getId() from addTeam

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team1);

      // When
      const result = await useCase.execute({ userId });

      // Then: should work, with first team marked as current
      expect(result.teams).toHaveLength(1);
      expect(result.currentTeamId).toBe(team1.getId().getValue());
      expect(result.teams[0].isCurrent).toBe(true);
    });

    it('should handle single team', async () => {
      // Given: user with only one team
      const userId = 'user-123';
      const team = Team.create('Only Team', userId, TeamSettings.create(undefined, true));

      const user = User.create(userId, 'test@example.com', 'Test User')
        .addTeam(team.getId());

      mockUserRepository.getById.mockResolvedValue(user);
      mockTeamRepository.getById.mockResolvedValue(team);

      // When
      const result = await useCase.execute({ userId });

      // Then
      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].name).toBe('Only Team');
      expect(result.teams[0].isCurrent).toBe(true);
      expect(result.teams[0].isOwner).toBe(true);
    });

    it('should handle many teams (5+)', async () => {
      // Given: user with 5 teams
      const userId = 'user-123';
      const teams = [
        Team.create('Team 1', userId, TeamSettings.create(undefined, true)),
        Team.create('Team 2', 'other', TeamSettings.create(undefined, true)),
        Team.create('Team 3', userId, TeamSettings.create(undefined, true)),
        Team.create('Team 4', 'other', TeamSettings.create(undefined, true)),
        Team.create('Team 5', userId, TeamSettings.create(undefined, true)),
      ];

      let user = User.create(userId, 'test@example.com', 'Test User');
      teams.forEach((team) => {
        user = user.addTeam(team.getId());
      });
      user = user.switchTeam(teams[2].getId()); // Set Team 3 as current

      mockUserRepository.getById.mockResolvedValue(user);
      teams.forEach((team) => {
        mockTeamRepository.getById.mockResolvedValueOnce(team);
      });

      // When
      const result = await useCase.execute({ userId });

      // Then
      expect(result.teams).toHaveLength(5);
      expect(result.currentTeamId).toBe(teams[2].getId().getValue());

      const currentTeam = result.teams.find((t) => t.isCurrent);
      expect(currentTeam!.name).toBe('Team 3');
    });
  });
});
