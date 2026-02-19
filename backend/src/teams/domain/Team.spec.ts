import { Team } from './Team';
import { TeamId } from './TeamId';
import { TeamSettings } from './TeamSettings';
import { InvalidTeamException } from './exceptions/InvalidTeamException';
import { TeamFactory } from './TeamFactory';

describe('Team Domain Entity', () => {
  const validOwnerId = 'user-123';

  describe('Team.create()', () => {
    it('should create a valid team with required fields', () => {
      const team = Team.create('My Team', validOwnerId);

      expect(team.getName()).toBe('My Team');
      expect(team.getOwnerId()).toBe(validOwnerId);
      expect(team.getSlug()).toBe('my-team');
      expect(team.getId()).toBeDefined();
      expect(team.getSettings()).toBeDefined();
    });

    it('should trim whitespace from name', () => {
      const team = Team.create('  My Team  ', validOwnerId);
      expect(team.getName()).toBe('My Team');
    });

    it('should generate lowercase slug', () => {
      const team = Team.create('My Cool Team!', validOwnerId);
      expect(team.getSlug()).toBe('my-cool-team');
    });

    it('should handle special characters in slug', () => {
      const team = Team.create('Team@#$%^&*()', validOwnerId);
      expect(team.getSlug()).toBe('team');
    });

    it('should reject name shorter than 3 chars', () => {
      expect(() => Team.create('ab', validOwnerId)).toThrow(
        InvalidTeamException,
      );
    });

    it('should reject name longer than 50 chars', () => {
      const longName = 'a'.repeat(51);
      expect(() => Team.create(longName, validOwnerId)).toThrow(
        InvalidTeamException,
      );
    });

    it('should reject empty name', () => {
      expect(() => Team.create('', validOwnerId)).toThrow(
        InvalidTeamException,
      );
    });

    it('should reject whitespace-only name', () => {
      expect(() => Team.create('   ', validOwnerId)).toThrow(
        InvalidTeamException,
      );
    });

    it('should reject missing ownerId', () => {
      expect(() => Team.create('My Team', '')).toThrow(InvalidTeamException);
    });

    it('should accept custom settings', () => {
      const settings = TeamSettings.create('workspace-123', false);
      const team = Team.create('My Team', validOwnerId, settings);

      expect(team.getSettings().defaultWorkspaceId).toBe('workspace-123');
      expect(team.getSettings().allowMemberInvites).toBe(false);
    });

    it('should use default settings if not provided', () => {
      const team = Team.create('My Team', validOwnerId);
      expect(team.getSettings().allowMemberInvites).toBe(true);
    });
  });

  describe('Team.isOwnedBy()', () => {
    it('should return true when user is owner', () => {
      const team = Team.create('My Team', validOwnerId);
      expect(team.isOwnedBy(validOwnerId)).toBe(true);
    });

    it('should return false when user is not owner', () => {
      const team = Team.create('My Team', validOwnerId);
      expect(team.isOwnedBy('other-user')).toBe(false);
    });
  });

  describe('Team.updateName()', () => {
    it('should update team name and timestamp', () => {
      const team = Team.create('Original Name', validOwnerId);
      const originalCreatedAt = team.getCreatedAt();

      const updatedTeam = team.updateName('New Name');

      expect(updatedTeam.getName()).toBe('New Name');
      expect(updatedTeam.getCreatedAt()).toEqual(originalCreatedAt);
      expect(updatedTeam.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        team.getUpdatedAt().getTime(),
      );
    });

    it('should validate new name like create()', () => {
      const team = Team.create('Original', validOwnerId);
      expect(() => team.updateName('ab')).toThrow(InvalidTeamException);
    });

    it('should preserve other fields when updating name', () => {
      const settings = TeamSettings.create('workspace-123');
      const team = Team.create('Original', validOwnerId, settings);

      const updated = team.updateName('Updated');

      expect(updated.getOwnerId()).toBe(team.getOwnerId());
      expect(updated.getId().equals(team.getId())).toBe(true);
      expect(updated.getSettings().defaultWorkspaceId).toBe('workspace-123');
    });
  });

  describe('Team.updateSettings()', () => {
    it('should update settings and timestamp', () => {
      const team = Team.create('My Team', validOwnerId);
      const newSettings = TeamSettings.create('new-workspace', false);

      const updated = team.updateSettings(newSettings);

      expect(updated.getSettings().defaultWorkspaceId).toBe('new-workspace');
      expect(updated.getSettings().allowMemberInvites).toBe(false);
    });

    it('should preserve other fields', () => {
      const team = Team.create('My Team', validOwnerId);
      const newSettings = TeamSettings.default();

      const updated = team.updateSettings(newSettings);

      expect(updated.getName()).toBe(team.getName());
      expect(updated.getOwnerId()).toBe(team.getOwnerId());
    });
  });

  describe('Team.toObject()', () => {
    it('should return serializable object', () => {
      const team = Team.create('My Team', validOwnerId);
      const obj = team.toObject();

      expect(obj.name).toBe('My Team');
      expect(obj.slug).toBe('my-team');
      expect(obj.ownerId).toBe(validOwnerId);
      expect(obj.id).toBeTruthy();
      expect(obj.createdAt).toBeTruthy();
      expect(obj.updatedAt).toBeTruthy();
    });
  });

  describe('TeamId Value Object', () => {
    it('should create TeamId from string', () => {
      const id = TeamId.create('team-123');
      expect(id.getValue()).toBe('team-123');
    });

    it('should generate unique TeamId', () => {
      const id1 = TeamId.generate();
      const id2 = TeamId.generate();
      expect(id1.equals(id2)).toBe(false);
    });

    it('should support equality check', () => {
      const id1 = TeamId.create('same-id');
      const id2 = TeamId.create('same-id');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should reject empty TeamId', () => {
      expect(() => TeamId.create('')).toThrow();
    });
  });

  describe('TeamSettings Value Object', () => {
    it('should create settings with all fields', () => {
      const settings = TeamSettings.create('workspace-123', false);
      expect(settings.defaultWorkspaceId).toBe('workspace-123');
      expect(settings.allowMemberInvites).toBe(false);
    });

    it('should provide defaults', () => {
      const settings = TeamSettings.default();
      expect(settings.defaultWorkspaceId).toBeUndefined();
      expect(settings.allowMemberInvites).toBe(true);
    });

    it('should support builder pattern', () => {
      const settings = TeamSettings.default()
        .withDefaultWorkspace('ws-1')
        .withMemberInvites(false);

      expect(settings.defaultWorkspaceId).toBe('ws-1');
      expect(settings.allowMemberInvites).toBe(false);
    });

    it('should serialize to object', () => {
      const settings = TeamSettings.create('ws-1', false);
      const obj = settings.toObject();

      expect(obj.defaultWorkspaceId).toBe('ws-1');
      expect(obj.allowMemberInvites).toBe(false);
    });
  });

  describe('TeamFactory', () => {
    it('should create team via factory', () => {
      const team = TeamFactory.createTeam('My Team', validOwnerId);
      expect(team.getName()).toBe('My Team');
    });

    it('should reconstitute team from persistence data', () => {
      const originalTeam = Team.create('My Team', validOwnerId);
      const obj = originalTeam.toObject();

      const reconstituted = TeamFactory.fromPersistence({
        id: obj.id,
        name: obj.name,
        slug: obj.slug,
        ownerId: obj.ownerId,
        settings: obj.settings as any,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      });

      expect(reconstituted.getName()).toBe(originalTeam.getName());
      expect(reconstituted.getSlug()).toBe(originalTeam.getSlug());
      expect(reconstituted.getId().equals(originalTeam.getId())).toBe(true);
    });

    it('should handle string dates in fromPersistence', () => {
      const team = TeamFactory.fromPersistence({
        id: 'team-123',
        name: 'Test',
        slug: 'test',
        ownerId: 'user-123',
        settings: { allowMemberInvites: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(team.getCreatedAt()).toBeInstanceOf(Date);
      expect(team.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('InvalidTeamException', () => {
    it('should provide helpful error messages', () => {
      const error = InvalidTeamException.invalidName('ab');
      expect(error.message).toContain('between 3 and 50 characters');
    });
  });
});
