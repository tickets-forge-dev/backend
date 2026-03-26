import { AEC } from './AEC';
import { AECStatus } from '../value-objects/AECStatus';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a minimal AEC via reconstitute with sensible defaults */
function makeAEC(overrides: { status?: AECStatus; approvedAt?: Date | null } = {}): AEC {
  return AEC.reconstitute(
    'aec_test1',
    'team_t1',
    'user_creator',
    overrides.status ?? AECStatus.DRAFT,
    'Test ticket',
    null, // description
    null, // type
    null, // priority
    80, // readinessScore (above 75 threshold for approve())
    { currentStep: 0, steps: [] }, // generationState
    [], // acceptanceCriteria
    [], // assumptions
    [], // repoPaths
    null, // codeSnapshot
    null, // apiSnapshot
    [], // questions
    null, // estimate
    [], // validationResults
    null, // externalIssue
    null, // driftDetectedAt
    null, // driftReason
    null, // repositoryContext
    new Date('2025-01-01'), // createdAt
    new Date('2025-01-01'), // updatedAt
    // Optional params — skipping to approvedAt at the end
    undefined, // clarificationQuestions
    undefined, // questionAnswers
    undefined, // questionsAnsweredAt
    undefined, // techSpec
    undefined, // taskAnalysis
    undefined, // cachedCodebaseContext
    undefined, // attachments
    undefined, // designReferences
    undefined, // assignedTo
    undefined, // reviewSession
    undefined, // reproductionSteps
    undefined, // implementationBranch
    undefined, // implementationSession
    undefined, // folderId
    undefined, // tagIds
    undefined, // includeWireframes
    undefined, // includeHtmlWireframes
    undefined, // includeApiSpec
    undefined, // apiSpecDeferred
    undefined, // wireframeContext
    undefined, // wireframeImageAttachmentIds
    undefined, // apiContext
    undefined, // slug
    undefined, // previousStatus
    undefined, // generationJobId
    overrides.approvedAt ?? null, // approvedAt
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AEC — approvedAt timestamp', () => {
  describe('createDraft', () => {
    it('initializes approvedAt as null', () => {
      const aec = AEC.createDraft('team_t1', 'user_creator', 'New ticket');
      expect(aec.approvedAt).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('restores approvedAt when provided', () => {
      const timestamp = new Date('2025-06-15T10:30:00Z');
      const aec = makeAEC({ status: AECStatus.APPROVED, approvedAt: timestamp });

      expect(aec.approvedAt).toEqual(timestamp);
    });

    it('restores approvedAt as null when not provided', () => {
      const aec = makeAEC({ status: AECStatus.DRAFT });

      expect(aec.approvedAt).toBeNull();
    });
  });

  describe('approve()', () => {
    it('sets approvedAt when transitioning REFINED → APPROVED', () => {
      const aec = makeAEC({ status: AECStatus.REFINED });

      const before = new Date();
      aec.approve();
      const after = new Date();

      expect(aec.approvedAt).not.toBeNull();
      expect(aec.approvedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(aec.approvedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(aec.status).toBe(AECStatus.APPROVED);
    });

    it('sets approvedAt when transitioning DEFINED → APPROVED with snapshot', () => {
      const aec = makeAEC({ status: AECStatus.DEFINED });

      const before = new Date();
      aec.approve({ files: [], summary: 'snapshot' } as any);
      const after = new Date();

      expect(aec.approvedAt).not.toBeNull();
      expect(aec.approvedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(aec.approvedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(aec.status).toBe(AECStatus.APPROVED);
    });
  });

  describe('sendBack()', () => {
    it('clears approvedAt when sending back from APPROVED to DRAFT', () => {
      const aec = makeAEC({
        status: AECStatus.APPROVED,
        approvedAt: new Date('2025-06-15'),
      });

      aec.sendBack(AECStatus.DRAFT);

      expect(aec.approvedAt).toBeNull();
      expect(aec.status).toBe(AECStatus.DRAFT);
    });

    it('clears approvedAt when sending back from REFINED to DEFINED', () => {
      const aec = makeAEC({
        status: AECStatus.REFINED,
        approvedAt: new Date('2025-06-15'),
      });

      aec.sendBack(AECStatus.DEFINED);

      expect(aec.approvedAt).toBeNull();
    });

    it('clears approvedAt when sending back from EXECUTING to DRAFT', () => {
      // Build a ticket that has gone through APPROVED → EXECUTING via startImplementation
      const approvedAec = makeAEC({
        status: AECStatus.APPROVED,
        approvedAt: new Date('2025-06-15'),
      });
      approvedAec.startImplementation('feat/some-branch');
      expect(approvedAec.status).toBe(AECStatus.EXECUTING);

      approvedAec.sendBack(AECStatus.DRAFT);

      expect(approvedAec.approvedAt).toBeNull();
      expect(approvedAec.status).toBe(AECStatus.DRAFT);
    });
  });

  describe('revertToDraft()', () => {
    it('clears approvedAt when reverting DELIVERED → DRAFT', () => {
      const aec = makeAEC({
        status: AECStatus.DELIVERED,
        approvedAt: new Date('2025-06-15'),
      });

      aec.revertToDraft();

      expect(aec.approvedAt).toBeNull();
      expect(aec.status).toBe(AECStatus.DRAFT);
    });
  });
});
