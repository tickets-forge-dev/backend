import { User } from './User';
import { UserFactory } from './UserFactory';
import { TeamId } from '../../teams/domain/TeamId';

describe('User Domain Entity', () => {
  const validUserId = 'firebase-uid-123';
  const validEmail = 'user@example.com';
  const validDisplayName = 'John Doe';

  describe('User.create()', () => {
    it('should create a valid user with required fields', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);

      expect(user.getUserId()).toBe(validUserId);
      expect(user.getEmail()).toBe(validEmail);
      expect(user.getDisplayName()).toBe(validDisplayName);
      expect(user.getCurrentTeamId()).toBeNull();
      expect(user.getTeams()).toEqual([]);
      expect(user.hasTeams()).toBe(false);
    });

    it('should trim whitespace from fields', () => {
      const user = User.create(
        '  uid-123  ',
        '  email@test.com  ',
        '  Jane Doe  ',
      );

      expect(user.getUserId()).toBe('uid-123');
      expect(user.getEmail()).toBe('email@test.com');
      expect(user.getDisplayName()).toBe('Jane Doe');
    });

    it('should use email prefix as displayName if not provided', () => {
      const user = User.create(validUserId, 'john@example.com', '');
      expect(user.getDisplayName()).toBe('john');
    });

    it('should accept optional photoURL', () => {
      const user = User.create(
        validUserId,
        validEmail,
        validDisplayName,
        'https://example.com/photo.jpg',
      );
      expect(user.getPhotoURL()).toBe('https://example.com/photo.jpg');
    });

    it('should reject empty userId', () => {
      expect(() => User.create('', validEmail, validDisplayName)).toThrow(
        'User ID is required',
      );
    });

    it('should reject empty email', () => {
      expect(() => User.create(validUserId, '', validDisplayName)).toThrow(
        'Email is required',
      );
    });
  });

  describe('User.addTeam()', () => {
    it('should add team and set as current if no current team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');

      const updated = user.addTeam(teamId);

      expect(updated.getTeams().length).toBe(1);
      expect(updated.getTeams()[0].equals(teamId)).toBe(true);
      expect(updated.getCurrentTeamId()?.equals(teamId)).toBe(true);
      expect(updated.hasTeams()).toBe(true);
    });

    it('should add team without changing current team if one is set', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const team1 = TeamId.create('team-1');
      const team2 = TeamId.create('team-2');

      const withTeam1 = user.addTeam(team1);
      const withTeam2 = withTeam1.addTeam(team2);

      expect(withTeam2.getTeams().length).toBe(2);
      expect(withTeam2.getCurrentTeamId()?.equals(team1)).toBe(true); // Still team-1
    });

    it('should not add duplicate team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');

      const withTeam = user.addTeam(teamId);
      const duplicate = withTeam.addTeam(teamId);

      expect(duplicate.getTeams().length).toBe(1);
    });

    it('should update timestamp when adding team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');

      const updated = user.addTeam(teamId);

      expect(updated.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        user.getUpdatedAt().getTime(),
      );
    });
  });

  describe('User.removeTeam()', () => {
    it('should remove team from teams array', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const team1 = TeamId.create('team-1');
      const team2 = TeamId.create('team-2');

      const withTeams = user.addTeam(team1).addTeam(team2);
      const removed = withTeams.removeTeam(team1);

      expect(removed.getTeams().length).toBe(1);
      expect(removed.getTeams()[0].equals(team2)).toBe(true);
    });

    it('should switch to next team if removing current team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const team1 = TeamId.create('team-1');
      const team2 = TeamId.create('team-2');

      const withTeams = user.addTeam(team1).addTeam(team2);
      const removed = withTeams.removeTeam(team1); // Remove current team

      expect(removed.getCurrentTeamId()?.equals(team2)).toBe(true);
    });

    it('should set currentTeamId to null if removing last team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');

      const withTeam = user.addTeam(teamId);
      const removed = withTeam.removeTeam(teamId);

      expect(removed.getCurrentTeamId()).toBeNull();
      expect(removed.hasTeams()).toBe(false);
    });

    it('should do nothing if team not in list', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('nonexistent-team');

      const removed = user.removeTeam(teamId);

      expect(removed).toBe(user); // No change
    });
  });

  describe('User.switchTeam()', () => {
    it('should switch to specified team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const team1 = TeamId.create('team-1');
      const team2 = TeamId.create('team-2');

      const withTeams = user.addTeam(team1).addTeam(team2);
      const switched = withTeams.switchTeam(team2);

      expect(switched.getCurrentTeamId()?.equals(team2)).toBe(true);
    });

    it('should throw error if switching to non-member team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('nonexistent-team');

      expect(() => user.switchTeam(teamId)).toThrow(
        'Cannot switch to team',
      );
    });

    it('should do nothing if already on team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');

      const withTeam = user.addTeam(teamId);
      const switched = withTeam.switchTeam(teamId);

      expect(switched).toBe(withTeam); // No change
    });

    it('should update timestamp when switching', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const team1 = TeamId.create('team-1');
      const team2 = TeamId.create('team-2');

      const withTeams = user.addTeam(team1).addTeam(team2);
      const switched = withTeams.switchTeam(team2);

      expect(switched.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        withTeams.getUpdatedAt().getTime(),
      );
    });
  });

  describe('User.isMemberOfTeam()', () => {
    it('should return true for member team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');

      const withTeam = user.addTeam(teamId);

      expect(withTeam.isMemberOfTeam(teamId)).toBe(true);
    });

    it('should return false for non-member team', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');

      expect(user.isMemberOfTeam(teamId)).toBe(false);
    });
  });

  describe('User.toObject()', () => {
    it('should serialize to object', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');
      const withTeam = user.addTeam(teamId);

      const obj = withTeam.toObject();

      expect(obj.userId).toBe(validUserId);
      expect(obj.email).toBe(validEmail);
      expect(obj.displayName).toBe(validDisplayName);
      expect(obj.currentTeamId).toBe(teamId.getValue());
      expect(obj.teams).toEqual([teamId.getValue()]);
    });

    it('should handle null currentTeamId', () => {
      const user = User.create(validUserId, validEmail, validDisplayName);
      const obj = user.toObject();

      expect(obj.currentTeamId).toBeNull();
      expect(obj.teams).toEqual([]);
    });
  });

  describe('UserFactory', () => {
    it('should create user via factory', () => {
      const user = UserFactory.createUser(
        validUserId,
        validEmail,
        validDisplayName,
      );

      expect(user.getUserId()).toBe(validUserId);
    });

    it('should reconstitute user from persistence', () => {
      const originalUser = User.create(validUserId, validEmail, validDisplayName);
      const teamId = TeamId.create('team-1');
      const withTeam = originalUser.addTeam(teamId);
      const obj = withTeam.toObject();

      const reconstituted = UserFactory.fromPersistence({
        userId: obj.userId,
        email: obj.email,
        displayName: obj.displayName,
        photoURL: obj.photoURL,
        currentTeamId: obj.currentTeamId,
        teams: obj.teams,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      });

      expect(reconstituted.getUserId()).toBe(withTeam.getUserId());
      expect(reconstituted.getTeams().length).toBe(1);
      expect(
        reconstituted.getCurrentTeamId()?.equals(teamId),
      ).toBe(true);
    });
  });
});
