import { ProjectProfile, InvalidProfileTransitionError } from '../ProjectProfile';

describe('ProjectProfile Domain Entity', () => {
  const defaultProps = {
    teamId: 'team-123',
    repoOwner: 'acme',
    repoName: 'web-app',
    branch: 'main',
    scannedBy: 'user-789',
  };

  describe('createNew()', () => {
    it('should create a profile with correct defaults', () => {
      const profile = ProjectProfile.createNew(
        defaultProps.teamId,
        defaultProps.repoOwner,
        defaultProps.repoName,
        defaultProps.branch,
        defaultProps.scannedBy,
      );

      expect(profile.id).toMatch(/^profile_/);
      expect(profile.teamId).toBe(defaultProps.teamId);
      expect(profile.repoOwner).toBe(defaultProps.repoOwner);
      expect(profile.repoName).toBe(defaultProps.repoName);
      expect(profile.branch).toBe(defaultProps.branch);
      expect(profile.scannedBy).toBe(defaultProps.scannedBy);
      expect(profile.status).toBe('pending');
      expect(profile.profileContent).toBeNull();
      expect(profile.scannedAt).toBeNull();
      expect(profile.fileCount).toBe(0);
      expect(profile.techStack).toEqual([]);
      expect(profile.commitSha).toBeNull();
      expect(profile.error).toBeNull();
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', () => {
      const p1 = ProjectProfile.createNew(
        defaultProps.teamId,
        defaultProps.repoOwner,
        defaultProps.repoName,
        defaultProps.branch,
        defaultProps.scannedBy,
      );
      const p2 = ProjectProfile.createNew(
        defaultProps.teamId,
        defaultProps.repoOwner,
        defaultProps.repoName,
        defaultProps.branch,
        defaultProps.scannedBy,
      );

      expect(p1.id).not.toBe(p2.id);
    });

    it('should return correct repoFullName', () => {
      const profile = ProjectProfile.createNew(
        defaultProps.teamId,
        defaultProps.repoOwner,
        defaultProps.repoName,
        defaultProps.branch,
        defaultProps.scannedBy,
      );

      expect(profile.repoFullName).toBe('acme/web-app');
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a profile from persistence data', () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      const updatedAt = new Date('2026-01-01T01:00:00Z');
      const scannedAt = new Date('2026-01-01T01:00:00Z');

      const profile = ProjectProfile.reconstitute({
        id: 'profile_existing',
        teamId: 'team-1',
        repoOwner: 'acme',
        repoName: 'api',
        branch: 'main',
        profileContent: '=== PROJECT PROFILE ===',
        status: 'ready',
        scannedAt,
        scannedBy: 'user-1',
        fileCount: 150,
        techStack: ['TypeScript', 'NestJS'],
        commitSha: 'abc1234',
        error: null,
        createdAt,
        updatedAt,
      });

      expect(profile.id).toBe('profile_existing');
      expect(profile.status).toBe('ready');
      expect(profile.profileContent).toBe('=== PROJECT PROFILE ===');
      expect(profile.fileCount).toBe(150);
      expect(profile.techStack).toEqual(['TypeScript', 'NestJS']);
      expect(profile.commitSha).toBe('abc1234');
      expect(profile.scannedAt).toBe(scannedAt);
    });
  });

  describe('Status transitions', () => {
    describe('valid transitions', () => {
      it('pending -> scanning', () => {
        const profile = ProjectProfile.createNew(
          defaultProps.teamId,
          defaultProps.repoOwner,
          defaultProps.repoName,
          defaultProps.branch,
          defaultProps.scannedBy,
        );

        profile.markScanning();

        expect(profile.status).toBe('scanning');
      });

      it('scanning -> ready', () => {
        const profile = ProjectProfile.createNew(
          defaultProps.teamId,
          defaultProps.repoOwner,
          defaultProps.repoName,
          defaultProps.branch,
          defaultProps.scannedBy,
        );
        profile.markScanning();

        profile.markReady('profile content', 200, ['TypeScript', 'React'], 'sha123');

        expect(profile.status).toBe('ready');
        expect(profile.profileContent).toBe('profile content');
        expect(profile.fileCount).toBe(200);
        expect(profile.techStack).toEqual(['TypeScript', 'React']);
        expect(profile.commitSha).toBe('sha123');
        expect(profile.scannedAt).toBeInstanceOf(Date);
      });

      it('scanning -> failed', () => {
        const profile = ProjectProfile.createNew(
          defaultProps.teamId,
          defaultProps.repoOwner,
          defaultProps.repoName,
          defaultProps.branch,
          defaultProps.scannedBy,
        );
        profile.markScanning();

        profile.markFailed('GitHub API rate limit');

        expect(profile.status).toBe('failed');
        expect(profile.error).toBe('GitHub API rate limit');
      });

      it('ready -> scanning (re-scan)', () => {
        const profile = ProjectProfile.reconstitute({
          id: 'profile_1',
          teamId: 'team-1',
          repoOwner: 'acme',
          repoName: 'app',
          branch: 'main',
          profileContent: 'old content',
          status: 'ready',
          scannedAt: new Date(),
          scannedBy: 'user-1',
          fileCount: 100,
          techStack: ['TypeScript'],
          commitSha: 'old-sha',
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        profile.markScanning();

        expect(profile.status).toBe('scanning');
      });

      it('failed -> scanning (retry)', () => {
        const profile = ProjectProfile.reconstitute({
          id: 'profile_1',
          teamId: 'team-1',
          repoOwner: 'acme',
          repoName: 'app',
          branch: 'main',
          profileContent: null,
          status: 'failed',
          scannedAt: null,
          scannedBy: 'user-1',
          fileCount: 0,
          techStack: [],
          commitSha: null,
          error: 'timeout',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        profile.markScanning();

        expect(profile.status).toBe('scanning');
      });
    });

    describe('invalid transitions', () => {
      it('pending -> ready should throw', () => {
        const profile = ProjectProfile.createNew(
          defaultProps.teamId,
          defaultProps.repoOwner,
          defaultProps.repoName,
          defaultProps.branch,
          defaultProps.scannedBy,
        );

        expect(() =>
          profile.markReady('content', 10, ['TS'], 'sha'),
        ).toThrow(InvalidProfileTransitionError);
      });

      it('pending -> failed should throw', () => {
        const profile = ProjectProfile.createNew(
          defaultProps.teamId,
          defaultProps.repoOwner,
          defaultProps.repoName,
          defaultProps.branch,
          defaultProps.scannedBy,
        );

        expect(() => profile.markFailed('error')).toThrow(
          InvalidProfileTransitionError,
        );
      });

      it('ready -> ready should throw', () => {
        const profile = ProjectProfile.reconstitute({
          id: 'profile_1',
          teamId: 'team-1',
          repoOwner: 'acme',
          repoName: 'app',
          branch: 'main',
          profileContent: 'content',
          status: 'ready',
          scannedAt: new Date(),
          scannedBy: 'user-1',
          fileCount: 100,
          techStack: ['TypeScript'],
          commitSha: 'sha123',
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        expect(() =>
          profile.markReady('new content', 200, ['Go'], 'sha456'),
        ).toThrow(InvalidProfileTransitionError);
      });

      it('InvalidProfileTransitionError includes from and to', () => {
        const profile = ProjectProfile.createNew(
          defaultProps.teamId,
          defaultProps.repoOwner,
          defaultProps.repoName,
          defaultProps.branch,
          defaultProps.scannedBy,
        );

        try {
          profile.markFailed('error');
          fail('Expected InvalidProfileTransitionError');
        } catch (e) {
          expect(e).toBeInstanceOf(InvalidProfileTransitionError);
          const err = e as InvalidProfileTransitionError;
          expect(err.from).toBe('pending');
          expect(err.to).toBe('failed');
          expect(err.message).toContain('pending');
          expect(err.message).toContain('failed');
        }
      });
    });
  });

  describe('isStale()', () => {
    it('should return true when commitSha is null', () => {
      const profile = ProjectProfile.createNew(
        defaultProps.teamId,
        defaultProps.repoOwner,
        defaultProps.repoName,
        defaultProps.branch,
        defaultProps.scannedBy,
      );

      expect(profile.isStale('any-sha')).toBe(true);
    });

    it('should return false when commitSha matches', () => {
      const profile = ProjectProfile.reconstitute({
        id: 'profile_1',
        teamId: 'team-1',
        repoOwner: 'acme',
        repoName: 'app',
        branch: 'main',
        profileContent: 'content',
        status: 'ready',
        scannedAt: new Date(),
        scannedBy: 'user-1',
        fileCount: 100,
        techStack: [],
        commitSha: 'abc123',
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(profile.isStale('abc123')).toBe(false);
    });

    it('should return true when commitSha differs', () => {
      const profile = ProjectProfile.reconstitute({
        id: 'profile_1',
        teamId: 'team-1',
        repoOwner: 'acme',
        repoName: 'app',
        branch: 'main',
        profileContent: 'content',
        status: 'ready',
        scannedAt: new Date(),
        scannedBy: 'user-1',
        fileCount: 100,
        techStack: [],
        commitSha: 'abc123',
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(profile.isStale('def456')).toBe(true);
    });
  });

  describe('isReady() / isScanning()', () => {
    it('isReady returns true for ready status', () => {
      const profile = ProjectProfile.reconstitute({
        id: 'p1',
        teamId: 't1',
        repoOwner: 'o',
        repoName: 'r',
        branch: 'main',
        profileContent: 'c',
        status: 'ready',
        scannedAt: new Date(),
        scannedBy: 'u',
        fileCount: 1,
        techStack: [],
        commitSha: 's',
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(profile.isReady()).toBe(true);
      expect(profile.isScanning()).toBe(false);
    });

    it('isScanning returns true for scanning status', () => {
      const profile = ProjectProfile.createNew(
        defaultProps.teamId,
        defaultProps.repoOwner,
        defaultProps.repoName,
        defaultProps.branch,
        defaultProps.scannedBy,
      );
      profile.markScanning();

      expect(profile.isScanning()).toBe(true);
      expect(profile.isReady()).toBe(false);
    });
  });

  describe('toPlainObject()', () => {
    it('should return a serializable plain object', () => {
      const profile = ProjectProfile.createNew(
        defaultProps.teamId,
        defaultProps.repoOwner,
        defaultProps.repoName,
        defaultProps.branch,
        defaultProps.scannedBy,
      );

      const plain = profile.toPlainObject();

      expect(plain.id).toBe(profile.id);
      expect(plain.teamId).toBe(defaultProps.teamId);
      expect(plain.repoOwner).toBe(defaultProps.repoOwner);
      expect(plain.repoName).toBe(defaultProps.repoName);
      expect(plain.branch).toBe(defaultProps.branch);
      expect(plain.status).toBe('pending');
      expect(plain.scannedAt).toBeNull();
      expect(plain.commitSha).toBeNull();
      expect(typeof plain.createdAt).toBe('string');
      expect(typeof plain.updatedAt).toBe('string');
    });
  });
});
