import { GenerationJob } from '../GenerationJob';
import { InvalidJobTransitionError } from '../InvalidJobTransitionError';

describe('GenerationJob Domain Entity', () => {
  const defaultProps = {
    teamId: 'team-123',
    ticketId: 'aec_456',
    ticketTitle: 'Implement login flow',
    createdBy: 'user-789',
  };

  describe('createNew()', () => {
    it('should create a job with correct defaults', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );

      expect(job.id).toMatch(/^job_/);
      expect(job.teamId).toBe(defaultProps.teamId);
      expect(job.ticketId).toBe(defaultProps.ticketId);
      expect(job.ticketTitle).toBe(defaultProps.ticketTitle);
      expect(job.createdBy).toBe(defaultProps.createdBy);
      expect(job.status).toBe('running');
      expect(job.phase).toBeNull();
      expect(job.percent).toBe(0);
      expect(job.attempt).toBe(1);
      expect(job.previousJobId).toBeNull();
      expect(job.error).toBeNull();
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.updatedAt).toBeInstanceOf(Date);
      expect(job.completedAt).toBeNull();
    });

    it('should store previousJobId when provided', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
        'job_previous-id',
      );

      expect(job.previousJobId).toBe('job_previous-id');
    });

    it('should generate unique IDs', () => {
      const job1 = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      const job2 = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a job from persistence data', () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      const updatedAt = new Date('2026-01-01T01:00:00Z');
      const completedAt = new Date('2026-01-01T01:00:00Z');

      const job = GenerationJob.reconstitute({
        id: 'job_existing',
        teamId: 'team-1',
        ticketId: 'aec_1',
        ticketTitle: 'Some ticket',
        createdBy: 'user-1',
        status: 'completed',
        phase: 'finalize',
        percent: 100,
        attempt: 2,
        previousJobId: 'job_old',
        error: null,
        createdAt,
        updatedAt,
        completedAt,
      });

      expect(job.id).toBe('job_existing');
      expect(job.status).toBe('completed');
      expect(job.phase).toBe('finalize');
      expect(job.percent).toBe(100);
      expect(job.attempt).toBe(2);
      expect(job.previousJobId).toBe('job_old');
      expect(job.completedAt).toBe(completedAt);
    });
  });

  describe('Status transitions', () => {
    describe('valid transitions from running', () => {
      it('running -> retrying', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );

        job.markRetrying();

        expect(job.status).toBe('retrying');
        expect(job.attempt).toBe(2);
      });

      it('running -> completed', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );

        job.markCompleted();

        expect(job.status).toBe('completed');
        expect(job.completedAt).toBeInstanceOf(Date);
      });

      it('running -> failed', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );

        job.markFailed('LLM timeout');

        expect(job.status).toBe('failed');
        expect(job.error).toBe('LLM timeout');
        expect(job.completedAt).toBeInstanceOf(Date);
      });

      it('running -> cancelled', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );

        job.markCancelled();

        expect(job.status).toBe('cancelled');
        expect(job.completedAt).toBeInstanceOf(Date);
      });
    });

    describe('valid transitions from retrying', () => {
      function createRetryingJob(): InstanceType<typeof GenerationJob> {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );
        job.markRetrying();
        return job;
      }

      it('retrying -> completed', () => {
        const job = createRetryingJob();
        job.markCompleted();
        expect(job.status).toBe('completed');
      });

      it('retrying -> failed', () => {
        const job = createRetryingJob();
        job.markFailed('Max retries exceeded');
        expect(job.status).toBe('failed');
        expect(job.error).toBe('Max retries exceeded');
      });

      it('retrying -> cancelled', () => {
        const job = createRetryingJob();
        job.markCancelled();
        expect(job.status).toBe('cancelled');
      });
    });

    describe('invalid transitions', () => {
      it('completed -> any should throw', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );
        job.markCompleted();

        expect(() => job.markRetrying()).toThrow(InvalidJobTransitionError);
        expect(() => job.markCancelled()).toThrow(InvalidJobTransitionError);
      });

      it('failed -> any should throw', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );
        job.markFailed('error');

        expect(() => job.markRetrying()).toThrow(InvalidJobTransitionError);
        expect(() => job.markCompleted()).toThrow(InvalidJobTransitionError);
        expect(() => job.markCancelled()).toThrow(InvalidJobTransitionError);
      });

      it('cancelled -> any should throw (except no-op guards)', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );
        job.markCancelled();

        expect(() => job.markRetrying()).toThrow(InvalidJobTransitionError);
      });

      it('retrying -> retrying should throw', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );
        job.markRetrying();

        expect(() => job.markRetrying()).toThrow(InvalidJobTransitionError);
      });

      it('InvalidJobTransitionError includes from and to statuses', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );
        job.markCompleted();

        try {
          job.markRetrying();
          fail('Expected InvalidJobTransitionError');
        } catch (e) {
          expect(e).toBeInstanceOf(InvalidJobTransitionError);
          const err = e as InvalidJobTransitionError;
          expect(err.from).toBe('completed');
          expect(err.to).toBe('retrying');
          expect(err.message).toContain('completed');
          expect(err.message).toContain('retrying');
        }
      });
    });

    describe('race condition guards', () => {
      it('markCompleted() is a no-op when cancelled', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );
        job.markCancelled();
        const cancelledAt = job.updatedAt;

        // Should NOT throw and should NOT change status
        job.markCompleted();

        expect(job.status).toBe('cancelled');
        // updatedAt should not have changed
        expect(job.updatedAt).toBe(cancelledAt);
      });

      it('markFailed() is a no-op when cancelled', () => {
        const job = GenerationJob.createNew(
          defaultProps.teamId,
          defaultProps.ticketId,
          defaultProps.ticketTitle,
          defaultProps.createdBy,
        );
        job.markCancelled();
        const cancelledAt = job.updatedAt;

        // Should NOT throw and should NOT change status
        job.markFailed('Some error');

        expect(job.status).toBe('cancelled');
        expect(job.error).toBeNull(); // Error should not be set
        expect(job.updatedAt).toBe(cancelledAt);
      });
    });
  });

  describe('updateProgress()', () => {
    it('should update phase and percent', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      const beforeUpdate = job.updatedAt;

      // Small delay to ensure updatedAt changes
      job.updateProgress('analyzing', 35);

      expect(job.phase).toBe('analyzing');
      expect(job.percent).toBe(35);
      expect(job.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it('should clamp percent to 0-100 range', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );

      job.updateProgress('phase1', -10);
      expect(job.percent).toBe(0);

      job.updateProgress('phase2', 150);
      expect(job.percent).toBe(100);
    });
  });

  describe('isActive()', () => {
    it('should return true for running status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      expect(job.isActive()).toBe(true);
    });

    it('should return true for retrying status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      job.markRetrying();
      expect(job.isActive()).toBe(true);
    });

    it('should return false for completed status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      job.markCompleted();
      expect(job.isActive()).toBe(false);
    });

    it('should return false for failed status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      job.markFailed('error');
      expect(job.isActive()).toBe(false);
    });

    it('should return false for cancelled status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      job.markCancelled();
      expect(job.isActive()).toBe(false);
    });
  });

  describe('isTerminal()', () => {
    it('should return false for running status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      expect(job.isTerminal()).toBe(false);
    });

    it('should return false for retrying status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      job.markRetrying();
      expect(job.isTerminal()).toBe(false);
    });

    it('should return true for completed status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      job.markCompleted();
      expect(job.isTerminal()).toBe(true);
    });

    it('should return true for failed status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      job.markFailed('error');
      expect(job.isTerminal()).toBe(true);
    });

    it('should return true for cancelled status', () => {
      const job = GenerationJob.createNew(
        defaultProps.teamId,
        defaultProps.ticketId,
        defaultProps.ticketTitle,
        defaultProps.createdBy,
      );
      job.markCancelled();
      expect(job.isTerminal()).toBe(true);
    });
  });
});
