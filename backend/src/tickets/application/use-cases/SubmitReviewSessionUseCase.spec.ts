import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubmitReviewSessionUseCase } from './SubmitReviewSessionUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import type { ReviewQAItem } from '../../domain/aec/AEC';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const TEAM_ID = 'team_abc123';
const TICKET_ID = 'aec_001';

const SAMPLE_QA: ReviewQAItem[] = [
  { question: 'What auth strategy should we use?', answer: 'JWT with 24h expiry' },
  { question: 'Should we add rate limiting?', answer: 'Yes, 100 req/min per user' },
];

function makeMockAEC(overrides: {
  teamId?: string;
  status?: AECStatus;
}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.DEV_REFINING,
    submitReviewSession: jest.fn(),
  };
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('SubmitReviewSessionUseCase', () => {
  let aecRepository: jest.Mocked<{ findById: jest.Mock; save: jest.Mock }>;
  let useCase: SubmitReviewSessionUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new SubmitReviewSessionUseCase(aecRepository as any);
  });

  // ── Happy path ────────────────────────────────────────────────────────────────

  describe('Happy Path', () => {
    it('calls aec.submitReviewSession() with qaItems and saves, then returns result', async () => {
      const mockAEC = makeMockAEC({});
      aecRepository.findById.mockResolvedValue(mockAEC);

      const result = await useCase.execute({
        ticketId: TICKET_ID,
        teamId: TEAM_ID,
        qaItems: SAMPLE_QA,
      });

      expect(mockAEC.submitReviewSession).toHaveBeenCalledWith(SAMPLE_QA);
      expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
      expect(result).toEqual({
        success: true,
        ticketId: TICKET_ID,
        status: mockAEC.status,
      });
    });

    it('returns success: true in result', async () => {
      const mockAEC = makeMockAEC({});
      aecRepository.findById.mockResolvedValue(mockAEC);

      const result = await useCase.execute({
        ticketId: TICKET_ID,
        teamId: TEAM_ID,
        qaItems: [],
      });

      expect(result.success).toBe(true);
    });

    it('returns ticketId and status in result', async () => {
      const mockAEC = makeMockAEC({ status: AECStatus.DEV_REFINING });
      aecRepository.findById.mockResolvedValue(mockAEC);

      const result = await useCase.execute({
        ticketId: TICKET_ID,
        teamId: TEAM_ID,
        qaItems: SAMPLE_QA,
      });

      expect(result.ticketId).toBe(TICKET_ID);
      expect(result.status).toBe(AECStatus.DEV_REFINING);
    });
  });

  // ── Error: ticket not found ────────────────────────────────────────────────────

  describe('Error Cases — Ticket Not Found', () => {
    it('throws NotFoundException when ticket does not exist', async () => {
      aecRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ ticketId: 'aec_nonexistent', teamId: TEAM_ID, qaItems: SAMPLE_QA }),
      ).rejects.toThrow(NotFoundException);

      expect(aecRepository.save).not.toHaveBeenCalled();
    });

    it('NotFoundException message includes ticketId', async () => {
      aecRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ ticketId: 'aec_missing', teamId: TEAM_ID, qaItems: [] }),
      ).rejects.toThrow('aec_missing');
    });
  });

  // ── Error: team ownership ─────────────────────────────────────────────────────

  describe('Error Cases — Team Ownership', () => {
    it('throws ForbiddenException when ticket belongs to a different team', async () => {
      const mockAEC = makeMockAEC({ teamId: 'team_other' });
      aecRepository.findById.mockResolvedValue(mockAEC);

      await expect(
        useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, qaItems: SAMPLE_QA }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockAEC.submitReviewSession).not.toHaveBeenCalled();
      expect(aecRepository.save).not.toHaveBeenCalled();
    });
  });
});
