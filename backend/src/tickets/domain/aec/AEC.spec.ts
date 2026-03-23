import { AEC } from './AEC';
import { AECStatus } from '../value-objects/AECStatus';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a minimal AEC via reconstitute with sensible defaults */
function makeAEC(overrides: { status?: AECStatus; forgedAt?: Date | null } = {}): AEC {
  return AEC.reconstitute(
    'aec_test1',
    'team_t1',
    'user_creator',
    overrides.status ?? AECStatus.DRAFT,
    'Test ticket',
    null, // description
    null, // type
    null, // priority
    80, // readinessScore (above 75 threshold for forge())
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
    // Optional params — skipping to forgedAt at the end
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
    undefined, // includeWireframes
    undefined, // includeApiSpec
    undefined, // apiSpecDeferred
    undefined, // wireframeContext
    undefined, // wireframeImageAttachmentIds
    undefined, // apiContext
    undefined, // slug
    undefined, // previousStatus
    undefined, // generationJobId
    overrides.forgedAt ?? null, // forgedAt
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AEC — forgedAt timestamp', () => {
  describe('createDraft', () => {
    it('initializes forgedAt as null', () => {
      const aec = AEC.createDraft('team_t1', 'user_creator', 'New ticket');
      expect(aec.forgedAt).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('restores forgedAt when provided', () => {
      const timestamp = new Date('2025-06-15T10:30:00Z');
      const aec = makeAEC({ status: AECStatus.FORGED, forgedAt: timestamp });

      expect(aec.forgedAt).toEqual(timestamp);
    });

    it('restores forgedAt as null when not provided', () => {
      const aec = makeAEC({ status: AECStatus.DRAFT });

      expect(aec.forgedAt).toBeNull();
    });
  });

  describe('approve()', () => {
    it('sets forgedAt when transitioning REVIEW → FORGED', () => {
      const aec = makeAEC({ status: AECStatus.REVIEW });

      const before = new Date();
      aec.approve();
      const after = new Date();

      expect(aec.forgedAt).not.toBeNull();
      expect(aec.forgedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(aec.forgedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(aec.status).toBe(AECStatus.FORGED);
    });
  });

  describe('forge()', () => {
    it('sets forgedAt when transitioning DEV_REFINING → FORGED', () => {
      const aec = makeAEC({ status: AECStatus.DEV_REFINING });

      const before = new Date();
      aec.forge({ files: [], summary: 'snapshot' } as any);
      const after = new Date();

      expect(aec.forgedAt).not.toBeNull();
      expect(aec.forgedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(aec.forgedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(aec.status).toBe(AECStatus.FORGED);
    });
  });

  describe('sendBack()', () => {
    it('clears forgedAt when sending back from FORGED to DRAFT', () => {
      const aec = makeAEC({
        status: AECStatus.FORGED,
        forgedAt: new Date('2025-06-15'),
      });

      aec.sendBack(AECStatus.DRAFT);

      expect(aec.forgedAt).toBeNull();
      expect(aec.status).toBe(AECStatus.DRAFT);
    });

    it('clears forgedAt when sending back from REVIEW to DEV_REFINING', () => {
      const aec = makeAEC({
        status: AECStatus.REVIEW,
        forgedAt: new Date('2025-06-15'),
      });

      aec.sendBack(AECStatus.DEV_REFINING);

      expect(aec.forgedAt).toBeNull();
    });

    it('clears forgedAt when sending back from EXECUTING to DRAFT', () => {
      // Build a ticket that has gone through FORGED → EXECUTING via startImplementation
      const forgedAec = makeAEC({
        status: AECStatus.FORGED,
        forgedAt: new Date('2025-06-15'),
      });
      forgedAec.startImplementation('feat/some-branch');
      expect(forgedAec.status).toBe(AECStatus.EXECUTING);

      forgedAec.sendBack(AECStatus.DRAFT);

      expect(forgedAec.forgedAt).toBeNull();
      expect(forgedAec.status).toBe(AECStatus.DRAFT);
    });
  });

  describe('revertToDraft()', () => {
    it('clears forgedAt when reverting COMPLETE → DRAFT', () => {
      const aec = makeAEC({
        status: AECStatus.COMPLETE,
        forgedAt: new Date('2025-06-15'),
      });

      aec.revertToDraft();

      expect(aec.forgedAt).toBeNull();
      expect(aec.status).toBe(AECStatus.DRAFT);
    });
  });
});
