import { Session } from '../Session';
import { SessionStatus } from '../SessionStatus';
import { InvalidSessionTransitionError } from '../InvalidSessionTransitionError';

describe('Session', () => {
  const validProps = {
    ticketId: 'aec-123',
    teamId: 'team-1',
    userId: 'user-1',
    ticketTitle: 'Add webhook retry',
    repoOwner: 'acme',
    repoName: 'api-backend',
    branch: 'feat/aec-123-webhook-retry',
  };

  describe('createNew', () => {
    it('should create a session in PROVISIONING status', () => {
      const session = Session.createNew(validProps);
      expect(session.status).toBe(SessionStatus.PROVISIONING);
      expect(session.ticketId).toBe('aec-123');
      expect(session.id).toMatch(/^session_/);
    });
  });

  describe('state transitions', () => {
    it('should transition PROVISIONING → RUNNING', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      expect(session.status).toBe(SessionStatus.RUNNING);
      expect(session.sandboxId).toBe('sandbox-123');
    });

    it('should transition RUNNING → COMPLETED', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      session.markCompleted(0.47, 'https://github.com/acme/api/pull/42', 42);
      expect(session.status).toBe(SessionStatus.COMPLETED);
      expect(session.costUsd).toBe(0.47);
      expect(session.prUrl).toBe('https://github.com/acme/api/pull/42');
    });

    it('should transition RUNNING → FAILED', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      session.markFailed('Sandbox timeout');
      expect(session.status).toBe(SessionStatus.FAILED);
      expect(session.error).toBe('Sandbox timeout');
    });

    it('should transition any active → CANCELLED', () => {
      const session = Session.createNew(validProps);
      session.markCancelled();
      expect(session.status).toBe(SessionStatus.CANCELLED);
    });

    it('should throw on invalid transition', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      session.markCompleted(0.5, 'url', 1);
      expect(() => session.markRunning('new-sandbox')).toThrow(InvalidSessionTransitionError);
    });

    it('should no-op markCompleted if already cancelled (race condition guard)', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      session.markCancelled();
      session.markCompleted(0.5, 'url', 1); // should not throw
      expect(session.status).toBe(SessionStatus.CANCELLED);
    });

    it('should no-op markFailed if already cancelled (race condition guard)', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      session.markCancelled();
      session.markFailed('error'); // should not throw
      expect(session.status).toBe(SessionStatus.CANCELLED);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from plain object', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      const plain = session.toPlainObject();
      const restored = Session.reconstitute(plain as any);
      expect(restored.id).toBe(session.id);
      expect(restored.status).toBe(SessionStatus.RUNNING);
      expect(restored.sandboxId).toBe('sandbox-123');
    });
  });

  describe('helper methods', () => {
    it('isActive returns true for PROVISIONING and RUNNING', () => {
      const session = Session.createNew(validProps);
      expect(session.isActive()).toBe(true);
      session.markRunning('sb');
      expect(session.isActive()).toBe(true);
    });

    it('isTerminal returns true for COMPLETED, FAILED, CANCELLED', () => {
      const s1 = Session.createNew(validProps);
      s1.markRunning('sb');
      s1.markCompleted(1, 'url', 1);
      expect(s1.isTerminal()).toBe(true);

      const s2 = Session.createNew(validProps);
      s2.markRunning('sb');
      s2.markFailed('err');
      expect(s2.isTerminal()).toBe(true);

      const s3 = Session.createNew(validProps);
      s3.markCancelled();
      expect(s3.isTerminal()).toBe(true);
    });
  });
});
