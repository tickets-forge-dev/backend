import { Folder } from './Folder';

describe('Folder Domain Entity', () => {
  const teamId = 'team_abc123';
  const userId = 'user_001';

  describe('Folder.create()', () => {
    it('should create a folder with valid fields', () => {
      const folder = Folder.create(teamId, userId, 'My Folder');

      expect(folder.getId()).toMatch(/^folder_/);
      expect(folder.getTeamId()).toBe(teamId);
      expect(folder.getName()).toBe('My Folder');
      expect(folder.getCreatedBy()).toBe(userId);
      expect(folder.getCreatedAt()).toBeInstanceOf(Date);
      expect(folder.getUpdatedAt()).toBeInstanceOf(Date);
      expect(folder.getScope()).toBe('team');
    });

    it('should create a folder with explicit scope', () => {
      const folder = Folder.create(teamId, userId, 'Private Folder', 'private');
      expect(folder.getScope()).toBe('private');
    });

    it('should default scope to "team"', () => {
      const folder = Folder.create(teamId, userId, 'Team Folder');
      expect(folder.getScope()).toBe('team');
    });

    it('should reject invalid scope', () => {
      expect(() => Folder.create(teamId, userId, 'Test', 'invalid' as any)).toThrow('scope must be');
    });

    it('should trim whitespace from name', () => {
      const folder = Folder.create(teamId, userId, '  Trimmed  ');
      expect(folder.getName()).toBe('Trimmed');
    });

    it('should generate unique IDs', () => {
      const f1 = Folder.create(teamId, userId, 'A');
      const f2 = Folder.create(teamId, userId, 'B');
      expect(f1.getId()).not.toBe(f2.getId());
    });

    it('should reject empty name', () => {
      expect(() => Folder.create(teamId, userId, '')).toThrow('Folder name cannot be empty');
    });

    it('should reject whitespace-only name', () => {
      expect(() => Folder.create(teamId, userId, '   ')).toThrow('Folder name cannot be empty');
    });

    it('should reject name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => Folder.create(teamId, userId, longName)).toThrow('between 1 and 100');
    });

    it('should reject empty teamId', () => {
      expect(() => Folder.create('', userId, 'Test')).toThrow('must belong to a team');
    });

    it('should reject empty userId', () => {
      expect(() => Folder.create(teamId, '', 'Test')).toThrow('must have a creator');
    });
  });

  describe('Folder.reconstitute()', () => {
    it('should reconstitute from persisted data', () => {
      const now = new Date();
      const folder = Folder.reconstitute('folder_123', teamId, 'Test', userId, now, now);

      expect(folder.getId()).toBe('folder_123');
      expect(folder.getName()).toBe('Test');
      expect(folder.getTeamId()).toBe(teamId);
      expect(folder.getCreatedBy()).toBe(userId);
      expect(folder.getScope()).toBe('team');
    });

    it('should reconstitute with explicit scope', () => {
      const now = new Date();
      const folder = Folder.reconstitute('folder_123', teamId, 'Test', userId, now, now, 'private');
      expect(folder.getScope()).toBe('private');
    });

    it('should default missing scope to "team" for migration support', () => {
      const now = new Date();
      const folder = Folder.reconstitute('folder_123', teamId, 'Test', userId, now, now, undefined);
      expect(folder.getScope()).toBe('team');
    });
  });

  describe('Folder.rename()', () => {
    it('should return a new folder with updated name', () => {
      const folder = Folder.create(teamId, userId, 'Original');
      const renamed = folder.rename('Renamed');

      expect(renamed.getName()).toBe('Renamed');
      expect(renamed.getId()).toBe(folder.getId());
      expect(renamed.getTeamId()).toBe(folder.getTeamId());
      expect(renamed.getCreatedBy()).toBe(folder.getCreatedBy());
    });

    it('should not mutate the original folder', () => {
      const folder = Folder.create(teamId, userId, 'Original');
      folder.rename('Renamed');
      expect(folder.getName()).toBe('Original');
    });

    it('should reject empty new name', () => {
      const folder = Folder.create(teamId, userId, 'Test');
      expect(() => folder.rename('')).toThrow('Folder name cannot be empty');
    });

    it('should trim the new name', () => {
      const folder = Folder.create(teamId, userId, 'Test');
      const renamed = folder.rename('  New Name  ');
      expect(renamed.getName()).toBe('New Name');
    });
  });

  describe('Folder.updateScope()', () => {
    it('should return a new folder with updated scope', () => {
      const folder = Folder.create(teamId, userId, 'Test');
      expect(folder.getScope()).toBe('team');

      const updated = folder.updateScope('private');
      expect(updated.getScope()).toBe('private');
      expect(updated.getId()).toBe(folder.getId());
      expect(updated.getName()).toBe(folder.getName());
    });

    it('should not mutate the original folder', () => {
      const folder = Folder.create(teamId, userId, 'Test');
      folder.updateScope('private');
      expect(folder.getScope()).toBe('team');
    });

    it('should reject invalid scope', () => {
      const folder = Folder.create(teamId, userId, 'Test');
      expect(() => folder.updateScope('invalid' as any)).toThrow('scope must be');
    });
  });

  describe('Folder.rename() with scope', () => {
    it('should preserve scope when renaming', () => {
      const folder = Folder.create(teamId, userId, 'Original', 'private');
      const renamed = folder.rename('Renamed');
      expect(renamed.getScope()).toBe('private');
    });
  });

  describe('Folder.toObject()', () => {
    it('should return a serializable object with scope', () => {
      const folder = Folder.create(teamId, userId, 'Test Folder');
      const obj = folder.toObject();

      expect(obj.id).toMatch(/^folder_/);
      expect(obj.teamId).toBe(teamId);
      expect(obj.name).toBe('Test Folder');
      expect(obj.createdBy).toBe(userId);
      expect(typeof obj.createdAt).toBe('string');
      expect(typeof obj.updatedAt).toBe('string');
      expect(obj.scope).toBe('team');
    });

    it('should include scope in serialized object', () => {
      const folder = Folder.create(teamId, userId, 'Private', 'private');
      const obj = folder.toObject();
      expect(obj.scope).toBe('private');
    });
  });
});
