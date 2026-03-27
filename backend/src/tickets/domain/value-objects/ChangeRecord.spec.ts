import {
  ChangeRecord,
  ChangeRecordStatus,
  FileChange,
  Divergence,
  createChangeRecord,
  acceptChangeRecord,
  requestChangesOnRecord,
} from './ChangeRecord';
import { ExecutionEvent, ExecutionEventType } from './ExecutionEvent';

describe('ChangeRecord', () => {
  const sampleEvents: ExecutionEvent[] = [
    {
      id: 'evt_1',
      type: ExecutionEventType.DECISION,
      title: 'Used token bucket',
      description: 'Better burst handling',
      createdAt: new Date(),
    },
    {
      id: 'evt_2',
      type: ExecutionEventType.RISK,
      title: 'Redis dependency',
      description: 'Requires Redis',
      createdAt: new Date(),
    },
  ];

  const sampleFiles: FileChange[] = [
    { path: 'src/auth/rate-limit.service.ts', additions: 142, deletions: 0 },
    { path: 'src/auth/auth.guard.ts', additions: 18, deletions: 8 },
  ];

  const sampleDivergences: Divergence[] = [
    {
      area: 'Rate limiting algorithm',
      intended: 'Sliding window counter',
      actual: 'Token bucket algorithm',
      justification: 'Better burst handling with same rate limit behavior',
    },
  ];

  it('creates a change record with AWAITING_REVIEW status', () => {
    const record = createChangeRecord({
      executionSummary: 'Added rate limiting to auth service',
      events: sampleEvents,
      filesChanged: sampleFiles,
      divergences: sampleDivergences,
    });

    expect(record.status).toBe(ChangeRecordStatus.AWAITING_REVIEW);
    expect(record.executionSummary).toBe('Added rate limiting to auth service');
    expect(record.filesChanged).toHaveLength(2);
    expect(record.divergences).toHaveLength(1);
    expect(record.hasDivergence).toBe(true);
    expect(record.decisions).toHaveLength(1);
    expect(record.risks).toHaveLength(1);
    expect(record.scopeChanges).toHaveLength(0);
    expect(record.reviewNote).toBeNull();
    expect(record.reviewedAt).toBeNull();
    expect(record.submittedAt).toBeInstanceOf(Date);
  });

  it('sets hasDivergence false when no divergences', () => {
    const record = createChangeRecord({
      executionSummary: 'Implemented as specified',
      events: [],
      filesChanged: sampleFiles,
      divergences: [],
    });

    expect(record.hasDivergence).toBe(false);
  });

  it('throws if executionSummary is empty', () => {
    expect(() =>
      createChangeRecord({
        executionSummary: '',
        events: [],
        filesChanged: [],
        divergences: [],
      }),
    ).toThrow('Execution summary is required');
  });

  describe('accept', () => {
    it('transitions AWAITING_REVIEW → ACCEPTED', () => {
      const record = createChangeRecord({
        executionSummary: 'Done',
        events: [],
        filesChanged: [],
        divergences: [],
      });

      const accepted = acceptChangeRecord(record);

      expect(accepted.status).toBe(ChangeRecordStatus.ACCEPTED);
      expect(accepted.reviewedAt).toBeInstanceOf(Date);
    });
  });

  describe('requestChanges', () => {
    it('transitions AWAITING_REVIEW → CHANGES_REQUESTED with note', () => {
      const record = createChangeRecord({
        executionSummary: 'Done',
        events: [],
        filesChanged: [],
        divergences: [],
      });

      const rejected = requestChangesOnRecord(record, 'Please use sliding window as specified');

      expect(rejected.status).toBe(ChangeRecordStatus.CHANGES_REQUESTED);
      expect(rejected.reviewNote).toBe('Please use sliding window as specified');
      expect(rejected.reviewedAt).toBeInstanceOf(Date);
    });

    it('throws if note is empty', () => {
      const record = createChangeRecord({
        executionSummary: 'Done',
        events: [],
        filesChanged: [],
        divergences: [],
      });

      expect(() => requestChangesOnRecord(record, '')).toThrow('Review note is required');
    });
  });
});
