import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApproveTicketUseCase } from './ApproveTicketUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const TEAM_ID = 'team_abc123';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: {
  status?: AECStatus;
  teamId?: string;
}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.WAITING_FOR_APPROVAL,
    title: 'Add login rate limiting',
    approve: jest.fn(),
  };
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('ApproveTicketUseCase', () => {
  let aecRepository: jest.Mocked<{ findById: jest.Mock; save: jest.Mock }>;
  let useCase: ApproveTicketUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ApproveTicketUseCase(aecRepository as any);
  });

  // ── Happy path ────────────────────────────────────────────────────────────────

  describe('Happy Path', () => {
    it('calls aec.approve() and saves, then returns the AEC', async () => {
      const mockAEC = makeMockAEC({});
      aecRepository.findById.mockResolvedValue(mockAEC);

      const result = await useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID });

      expect(mockAEC.approve).toHaveBeenCalledTimes(1);
      expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
      expect(result).toBe(mockAEC);
    });

    it('does not throw when ticket status is WAITING_FOR_APPROVAL', async () => {
      const mockAEC = makeMockAEC({ status: AECStatus.WAITING_FOR_APPROVAL });
      aecRepository.findById.mockResolvedValue(mockAEC);

      await expect(
        useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID }),
      ).resolves.not.toThrow();
    });
  });

  // ── Error: ticket not found ────────────────────────────────────────────────────

  describe('Error Cases — Ticket Not Found', () => {
    it('throws NotFoundException when ticket does not exist', async () => {
      aecRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ ticketId: 'aec_nonexistent', teamId: TEAM_ID }),
      ).rejects.toThrow(NotFoundException);

      expect(aecRepository.save).not.toHaveBeenCalled();
    });
  });

  // ── Error: team ownership ─────────────────────────────────────────────────────

  describe('Error Cases — Team Ownership', () => {
    it('throws ForbiddenException when ticket belongs to a different team', async () => {
      const mockAEC = makeMockAEC({ teamId: 'team_other' });
      aecRepository.findById.mockResolvedValue(mockAEC);

      await expect(
        useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockAEC.approve).not.toHaveBeenCalled();
      expect(aecRepository.save).not.toHaveBeenCalled();
    });
  });

  // ── Error: wrong status ────────────────────────────────────────────────────────

  describe('Error Cases — Status Precondition', () => {
    it.each([
      AECStatus.DRAFT,
      AECStatus.READY,
      AECStatus.CREATED,
      AECStatus.VALIDATED,
    ])('throws BadRequestException when status is %s (not WAITING_FOR_APPROVAL)', async (status) => {
      const mockAEC = makeMockAEC({ status });
      aecRepository.findById.mockResolvedValue(mockAEC);

      await expect(
        useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID }),
      ).rejects.toThrow(BadRequestException);

      expect(mockAEC.approve).not.toHaveBeenCalled();
      expect(aecRepository.save).not.toHaveBeenCalled();
    });
  });
});
